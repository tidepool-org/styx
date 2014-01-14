#! /bin/bash -eu

rm -rf node_modules
npm install .
./node_modules/.bin/mocha test
for file in `ls example/*.js`; do
  echo "RUNNING file[${file}]"
  node $file
done;