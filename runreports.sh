# Copyright 2024 Jospeh P Medley

#!/bin/sh

npm run update-data -- -s

npm run burn bcd -- -c api -b all
npm run burn bcd -- -c css -b all
npm run burn bcd -- -c html -b all
npm run burn bcd -- -c javascript -b all
npm run burn bcd -- -c mathml -b all
npm run burn bcd -- -c webextensions -b all

npm run burn chrome -- -a -f -o -n needed-chrome-docs-Google
npm run burn chrome -- -a -t mdnreports.txt -n implementation-counts
npm run burn chrome -- -n needed-docs
# npm run burn chrome -- -i -f -o -n puppy-planning
npm run burn chrome -- -i -n interfaces-only
npm run burn chrome -- -c -n missing-members
npm run burn chrome -- -r fugu-rl.json -n fugu
npm run burn chrome -- -a -i -t mdnreports.txt -n StableInterfaces

npm run burn urls -- -c api
npm run burn urls -- -c css
npm run burn urls -- -c html
npm run burn urls -- -c javascript
# npm run burn urls -- -c mathml
# npm run burn urls -- -c webextensions