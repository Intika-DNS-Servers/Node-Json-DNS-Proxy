[![npm](https://img.shields.io/npm/dt/dns-proxy2.svg)](https://github.com/marlic7/dns-proxy2) [![Github All Releases](https://img.shields.io/github/downloads/marlic7/dns-proxy2/total.svg)](https://github.com/marlic7/dns-proxy2) [![npm](https://img.shields.io/npm/l/dns-proxy2.svg)](https://github.com/marlic7/dns-proxy2)

# DNS Proxy

Simple DNS Proxy written in Node.JS

Designed to allow you to override hosts or domains with specific answers or override tlds, or domains to use different nameservers. It has simple cache for speed up DNS responses.
Useful for local/home usage or when using VPN connections with split DNS setups.

This app makes use of the [rc](https://www.npmjs.com/package/rc) module for configuration, the default configuration is below, use any file location to override the defaults. Appname is `dnsproxy` when creating a configuration file.

I can guarentee this app isn't perfect but fulfills my current needs for routing certain domains to private IP name servers when on VPN.

## Install

`npm install -g dns-proxy`

## Install on Raspberry Pi (with installed docker-engine and docker-compose)
```bash
vim docker-compose.yml
vim conf.json
docker-compose up -d
```

## Examples

For nameserver overrides if an answer isn't received by a threshold (350ms by default) DNS proxy will fallback to one of the default nameservers provided in the configuration (by default 8.8.8.8 or 8.8.4.4)

### TLD Specific Nameserver

This will send all .com queries to 8.8.8.8 and .dk queries to 127.0.0.1 and custom port 54.
```json
"servers": {
  "com": "8.8.8.8",
  "dk": "127.0.0.1:54"
}
```
* This is a snippet that will go into your rc config file.

### Domain Specific Nameserver

This will match all google.com and its subdomains.
```json
"servers": {
  "google.com": "8.8.8.8"
}
```
* This is a snippet that will go into your rc config file.

### Domain Specific Answers
This will match all of google.com and its subdomains and return 127.0.0.1 as the answer. This technically doens't even have to be a real domain or a full domain, if you configure `ogle.com` and do a lookup on `google.com`, the `ogle.com` will match.
```json
"domains": {
  "google.com": "127.0.0.1"
}
```

### Aliases

**Domains** and **Hosts** support aliases now, whereby you can define a host like normal such as `"hi": "127.0.0.1"` and in another entry reference it like `"hello": "hi"`.

## Default Configuration
This is the default configuration in the application, you should override this by creating the proper rc file in one of the searchable paths.
```json
{
  "port": 8053,
  "host": "127.0.0.1",
  "logging": "dnsproxy:query,dnsproxy:info",
  "nameservers": [
    "8.8.8.8",
    "8.8.4.4",
    "8.8.8.8"
  ],
  "servers": {},
  "domains": {
    "dev": "127.0.0.1"
  },
  "hosts": {
    "devlocal": "127.0.0.1"
  },
  "fallback_timeout": 150,
  "reload_config": true,
  "maxTtl": 172800,
  "minTtl": 300,
  "nxdomainTtl": 600
}
```
* Note this snippet is JavaScript and rc config file format is JSON.

## Logging

Logging is handled by the simple lightweight [debug](https://www.npmjs.com/package/debug) package. By default all queries are logged. To change the logging output update the `logging` variable to any of the following: dns-proxy:error, dns-proxy:query, dns-proxy:debug. You can specify all or none, separate using a comma, a wildcard can be used as well.


## Running as a Service

### OSX

You can copy the `resources/launchd.plist` file into `/Library/LaunchDaemons` as `com.github.ekristen.dns-proxy.plist`. To start just run `sudo launchctl load /Library/LaunchDaemons/com.github.ekristen.dns-proxy.plist`. This will also make the dns-proxy service to start on boot.
