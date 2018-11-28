#!/bin/bash
# 1. 删除 .only
# 2. 删除 console.log(info, debug 等)

echo "1. remove '.only' in tests"
git diff --name-status --cached | grep -v D | awk '{print $2}' | grep "\.js" | grep -v json  | grep "test/" | xargs grep "\.only(" -nH > tmp.log
onlyCheckFiles=$(cat tmp.log)
if [[ -z $onlyCheckFiles ]];then
  :
else
  echo "checking results:"
  cat tmp.log
  files=$(cat tmp.log | cut -d : -f 1 | sort -u)
  sed -i '' 's/.only//g' $files
  git add $files || true
fi

echo "remove '.only' in tests succ! \n"

echo "2. remove 'console.' in tests"
git diff --name-status --cached | grep -v D | awk '{print $2}' | grep "\.js" | grep -v json  | grep "lib/\|test/" | xargs grep "console.log(" -nH > tmp.log
onlyCheckFiles=$(cat tmp.log)
if [[ -z $onlyCheckFiles ]];then
  :
else
  echo "checking results:"
  cat tmp.log
  files=$(cat tmp.log | cut -d : -f 1 | sort -u)
  sed -Ei '' 's/console.(log|debug|info|...|count)\((.*)\);?//g' $files
  git add $files || true
fi

echo "remove 'console.' in tests succ! \n"

rm -f tmp.log