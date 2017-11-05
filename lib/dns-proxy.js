#!/usr/bin/env node

process.title = 'dns-proxy';

const fs = require('fs')
const rc = require('rc')
const dgram = require('dgram')
const packet = require('native-dns-packet')
const util = require('./util.js')
const defaults = require('./default-config')

let config = rc('dnsproxy', defaults)

// logger
process.env.DEBUG_FD = process.env.DEBUG_FD || 1
process.env.DEBUG = process.env.DEBUG || config.logging
let d = process.env.DEBUG.split(',')
d.push('dnsproxy:error')
process.env.DEBUG = d.join(',')
const loginfo = require('debug')('dnsproxy:info')
const logdebug = require('debug')('dnsproxy:debug')
const logquery = require('debug')('dnsproxy:query')
const logerror = require('debug')('dnsproxy:error')

// config hot reload
if (config.reload_config === true) {
  var configFile = config.config
  fs.watchFile(configFile, function (curr, prev) {
    loginfo('config file changed, reloading config options')
    try {
      config = rc('dnsproxy', defaults)
      logdebug('options: %j', config)
    } catch (e) {
      logerror('error reloading configuration')
      logerror(e)
    }
  })
}
logdebug('options: %j', config)

const server = dgram.createSocket('udp4')

// cache storage
let dnsCache = []
function cacheClean () {
  setTimeout(() => {
    dnsCache.forEach(v => {
      v.ttl = v.ttl - 10
    })
    dnsCache = dnsCache.filter(v => v.ttl > 0)
    logdebug('cacheClean, cacheLength: %d', dnsCache.length)
    cacheClean()
  }, 10000)
}
cacheClean()

server.on('listening', () => {
  loginfo('we are up and listening at %s on %s', config.host, config.port)
})

server.on('error', err => {
  logerror('udp socket error')
  logerror(err)
})

function stripHostSufix (sufixes, domain) {
  for (let sufix of sufixes) {
    if (domain.endsWith(`.${sufix}`)) {
      return domain.substr(0, domain.length - (sufix.length + 1))
    }
  }
  return domain
}

server.on('message', (message, rinfo) => {
  let returner = false
  let nameServerIdx = 0
  let nameserver = config.nameservers[nameServerIdx]
  let nameServerCnt = config.nameservers.length

  const query = packet.parse(message)
  const domain = query.question[0].name
  const type = query.question[0].type
  let domain2

  logdebug('query: %j', query)

  if (config.hosts_sufixes) {
    domain2 = stripHostSufix(config.hosts_sufixes, domain)
  }

  Object.keys(config.hosts).forEach(h => {
    if (domain === h || domain2 === h) {
      let answer = config.hosts[h]
      if (typeof config.hosts[config.hosts[h]] !== 'undefined') {
        answer = config.hosts[config.hosts[h]]
      }

      logquery('type: host, domain: %s, answer: %s, source: %s:%s, size: %d', domain, config.hosts[h], rinfo.address, rinfo.port, rinfo.size)

      let res = util.createAnswer(query, answer)
      server.send(res, 0, res.length, rinfo.port, rinfo.address)

      returner = true
    }
  })

  if (returner) {
    return
  }

  Object.keys(config.domains).forEach(s => {
    let sLen = s.length
    let dLen = domain.length

    if (domain.indexOf(s) >= 0 && domain.indexOf(s) === (dLen - sLen)) {
      let answer = config.domains[s]
      if (typeof config.domains[config.domains[s]] !== 'undefined') {
        answer = config.domains[config.domains[s]]
      }

      logquery('type: server, domain: %s, answer: %s, source: %s:%s, size: %d', domain, config.domains[s], rinfo.address, rinfo.port, rinfo.size)

      let res = util.createAnswer(query, answer)
      server.send(res, 0, res.length, rinfo.port, rinfo.address)

      returner = true
    }
  })
  if (returner) {
    return
  }

  // Response from local cache if exists
  let cacheHit = dnsCache.find(v => v.name === domain && v.type === type)
  if (cacheHit) {
    let res = util.createAnswerFromCache(query, cacheHit.answer)
    server.send(res, 0, res.length, rinfo.port, rinfo.address)

    logquery('type: cache, query: %s, type: %s, answer: %s, source: %s:%s, size: %d, ttl: %d, cacheLength: %d',
      domain,
      util.records[type] || 'unknown',
      util.listAnswer({ answer: cacheHit.answer }),
      rinfo.address,
      rinfo.port,
      rinfo.size,
      cacheHit.ttl,
      dnsCache.length
    )
    return
  }

  // lookup for specific name server depends on query domain
  Object.keys(config.servers).forEach(s => {
    if (domain.indexOf(s) !== -1) {
      nameserver = config.servers[s]
    }
  })
  let nameParts = nameserver.split(':')
  nameserver = nameParts[0]
  let port = nameParts[1] || 53
  let fallback

  function queryns (message, nameserver) {
    const sock = dgram.createSocket('udp4')
    const startTime = process.hrtime()
    sock.send(message, 0, message.length, port, nameserver, () => {
      fallback = setTimeout(() => {
        if (nameServerCnt <= nameServerIdx) {
          loginfo('no more fallbacks')
          return
        }
        nameServerIdx++
        queryns(message, config.nameservers[nameServerIdx])
        logdebug('fallback')
      }, config.fallback_timeout)
    })
    sock.on('error', err => {
      logerror('Socket Error: %s', err)
      process.exit(5)
    })
    sock.on('message', response => {
      clearTimeout(fallback)
      const hrTime = process.hrtime(startTime)
      const processTime = (hrTime[0] * 1000 + hrTime[1] / 1000000) + 'ms'

      server.send(response, 0, response.length, rinfo.port, rinfo.address)

      let parsedResp = packet.parse(response)
      logquery('type: primary, nameserver: %s, query: %s, type: %s, answer: %s, source: %s:%s, size: %d, time: %s',
        nameserver,
        domain,
        util.records[type] || 'unknown',
        util.listAnswer(parsedResp),
        rinfo.address,
        rinfo.port,
        rinfo.size,
        processTime
      )
      logdebug('dns response: %j', parsedResp)

      if (parsedResp.answer[0]) {
        const ttlMin = parsedResp.answer.reduce((a, c) => {
          return (c.ttl < a ? (c.ttl < config.minTtl ? config.minTtl : c.ttl) : a)
        }, config.maxTtl)
        dnsCache.push({
          name: domain,
          type: type,
          ttl: ttlMin,
          answer: parsedResp.answer
        })
      } else {
        dnsCache.push({
          name: domain,
          type: type,
          ttl: config.nxdomainTtl,
          answer: []
        })
      }

      sock.close()
    })
  }
  queryns(message, nameserver)
})

server.bind(config.port, config.host)
