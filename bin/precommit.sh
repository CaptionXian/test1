#!/bin/bash

RED=`tput setaf 1`
NOCOLOR=`tput sgr0`

echo "Pre-commit checkings"
echo "1. pre-commit checking test '.only'"
git diff --name-status --cached | grep -v D | grep -v 'R[0-1][0-9][0-9]' | awk '{print $2}' | grep "\.js" | grep -v json  | grep "test/" | xargs grep "\.only(" -n > grep.log
git diff --name-status --cached | grep  'R[0-1][0-9][0-9]' | awk '{print $3}' | grep "\.js" | grep -v json  | grep "test/" | xargs grep "\.only(" -n >> grep.log
onlyCheckFiles=$(cat grep.log)
if [[ -z $onlyCheckFiles ]];then
  echo "pre-commit checking test '.only' succ! \n"
else
  checkFailed=true
  echo "checking results:"
  cat grep.log
  echo "\n${RED}pre-commit checking test '.only' faild! ${NOCOLOR}\n"
fi

echo "2. pre-commit checking 'console'"
git diff --name-status --cached | grep -v D | grep -v 'R[0-1][0-9][0-9]' | awk '{print $2}' | grep "\.js" | grep -v json  | grep "lib/\|test/" | xargs grep 'console.' -n > grep.log
git diff --name-status --cached | grep 'R[0-1][0-9][0-9]' | awk '{print $3}' | grep "\.js" | grep -v json  | grep "lib/\|test/" | xargs grep 'console.' -n >> grep.log
consoleCheckFiles=$(cat grep.log)
if [[ -z $consoleCheckFiles ]];then
echo "pre-commit checking 'console' succ! \n"
else
  checkFailed=true
  echo "checking results:"
  cat grep.log
  echo "\n${RED}pre-commit checking 'console' faild! \n"
fi

if [ "$checkFailed" = true ] ; then
  exit -1
fi

# 分支 prettier 之后, 提交 prettier 之后的代码不希望再次 prettier, 所以这里跳过
if [ "$1" != "skip-prettier" ]; then
    echo "3. pre-commit auto prettier"
    git diff --name-status --cached | grep -v D | grep -v 'R[0-1][0-9][0-9]' | awk '{print $2}' > grep.log
    git diff --name-status --cached | grep 'R[0-1][0-9][0-9]' | awk '{print $3}' >> grep.log
    toCommitedFiles=$(cat grep.log | grep "\.js" | grep -v json)
    if [[ -n $toCommitedFiles ]];then
      echo "${RED}To formatting files:"
      echo $toCommitedFiles
      echo
      echo "prettier-started:"
      prettier-standard $toCommitedFiles
      echo "prettier-finished\n"
      git add $toCommitedFiles
      echo "\npre-commit prettier succ! \n"
    fi
fi

echo "All pre-commit checking succ! \n"

rm -f grep.log
