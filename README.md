# Test API

Check endpoints for testing...

## Installation

Just run:

```bash
sudo apt install jq
npm install --production
```

## Run

```bash
npm run start
```

Now your can open your browser for api documentation.

* http://127.0.0.1:10000/docs
* https://127.0.0.1:10001/docs

### Test

You can upload file and the end point wil also send same file as response

#### Sample test

Raw data

```bash
curl -s -X POST -H 'Content-Type: application/json' -d '{"username":"davidwalsh","password":"something"}' 'http://127.0.0.1:10000/POST1' | jq
```

Form data

```bash
curl -s -X POST -H  "Content-Type: application/x-www-form-urlencoded" -d "zoo=cat" 'http://127.0.0.1:10000/POST2' | jq
```

#### File upload test

All check sum must be same.

```bash
date > tmp/hello.txt \
  && md5sum tmp/hello.txt \
  && curl -s -X POST -H "Content-Type: multipart/form-data" -F "data=@tmp/hello.txt" 'http://127.0.0.1:10000/FILE1' | md5sum \
  && curl -s --cacert cert/ca.pem -X POST -H "Content-Type: multipart/form-data" -F "data=@tmp/hello.txt" 'https://127.0.0.1:10001/FILE1' | md5sum
```

## Generate certificate

Just import `cert/ca.pem` in your http client.
