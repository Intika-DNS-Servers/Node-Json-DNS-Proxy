module.exports = {
  port: 53,
  host: '127.0.0.1',
  logging: 'dnsproxy:query,dnsproxy:info',
  nameservers: [
    '8.8.8.8',
    '8.8.4.4'
  ],
  servers: {},
  domains: {
    'dev': '127.0.0.1'
  },
  hosts: {
    'devlocal': '127.0.0.1'
  },
  fallback_timeout: 350,
  reload_config: true,
  maxTtl: 172800,
  minTtl: 300
}
