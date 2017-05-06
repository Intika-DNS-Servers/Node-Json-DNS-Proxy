let qry_01 = {
    "header": {
      "id": 28140,
      "qr": 0,
      "opcode": 0,
      "aa": 0,
      "tc": 0,
      "rd": 1,
      "ra": 0,
      "res1": 0,
      "res2": 0,
      "res3": 0,
      "rcode": 0
    },
    "question": [{
      "name": "notifications.google.com",
      "type": 1,
      "class": 1
    }],
    "answer": [],
    "authority": [],
    "additional": [],
    "edns_options": []
  }

//dnsproxy:query type: primary, nameserver: 8.8.8.8, query: notifications.google.com, type: A, answer: plus.l.google.com, 216.58.209.78, 216.58.209.78, 216.58.209.78, source: 127.0.0.1:16885, size: 42, time: 25.278105ms +27ms
let res_01 = {
  "header": {
    "id": 28140,
    "qr": 1,
    "opcode": 0,
    "aa": 0,
    "tc": 0,
    "rd": 1,
    "ra": 1,
    "res1": 0,
    "res2": 0,
    "res3": 0,
    "rcode": 0
  },
  "question": [{
    "name": "notifications.google.com",
    "type": 1,
    "class": 1
  }],
  "answer": [{
    "name": "notifications.google.com",
    "type": 5,
    "class": 1,
    "ttl": 3599,
    "data": "plus.l.google.com"
  }, {
    "name": "plus.l.google.com",
    "type": 1,
    "class": 1,
    "ttl": 299,
    "address": "216.58.209.78"
  }, {
    "name": "plus.l.google.com",
    "type": 1,
    "class": 1,
    "ttl": 299,
    "address": "216.58.209.78"
  }, {
    "name": "plus.l.google.com",
    "type": 1,
    "class": 1,
    "ttl": 299,
    "address": "216.58.209.78"
  }],
  "authority": [],
  "additional": [],
  "edns_options": []
}
