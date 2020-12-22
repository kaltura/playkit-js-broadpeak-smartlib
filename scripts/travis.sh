#!/bin/sh
# https://docs.travis-ci.com/user/customizing-the-build/#Implementing-Complex-Build-Steps
set -ev
 yarn install
 if [ "${TRAVIS_MODE}" = "lint" ]; then
  yarn run eslint
elif [ "${TRAVIS_MODE}" = "flow" ]; then
  yarn run flow
elif [ "${TRAVIS_MODE}" = "unitTests" ]; then
	yarn run test
else
	echo "Unknown travis mode: ${TRAVIS_MODE}" 1>&2
	exit 1
fi
