"use strict";
var requestify = require('requestify');
var util = require('util');
var ldClient = require("ldclient-node").init(process.env.LD_API_KEY);

const featureKey = "test-feature";
const userKey = "test";

// flip between two feature states, "A" and "B"
// In state A, no users are flagged for the feature
// In state B, a single user with ID "test" is flagged
const featureStates = {
  "dont_show": [
    {
      value: true,
      weight: 0,
      userTarget: { attribute: 'key', op: 'in', values: [] },
      targets: []
    },
    {
      value: false,
      weight: 100,
      userTarget: { attribute: 'key', op: 'in', values: [] },
      targets: []
    }
  ],
  "show": [
    {
      value: true,
      weight: 0,
      userTarget: { attribute: 'key', op: 'in', values: [userKey] },
      targets: []
    },
    {
      value: false,
      weight: 100,
      userTarget: { attribute: 'key', op: 'in', values: [] },
      targets: []
    }
  ]
};
let currentState = "dont_show";

// every tick, flip the state of the feature
const featureFlipTick = 60 * 6 * 1000; // 6 minutes
function featureFlip() {
  const requestURL = 'https://app.launchdarkly.com/api/features/' + featureKey;
  const newFeatureState = (currentState === "dont_show" ? "show" : "dont_show");
  const requestParams = {
    method: "PATCH",
    headers: {
      'Authorization': 'api_key ' + process.env.LD_API_KEY
    },
    timeout: 5 * 1000,
    body: [{
      "op": "replace", "path": "/variations", "value": featureStates[newFeatureState]
    }]
  };
  requestify.request(requestURL, requestParams)
    .then((response) => {
      currentState = newFeatureState;
    }, (err) => {
      console.log("ERROR", err);
    });
};
featureFlip();
setInterval(featureFlip, featureFlipTick);

// every tick, check if user is flagged
const userToggleCheckTick = 1 * 1000; // 1 second
setInterval(() => {
  ldClient.toggle(featureKey, {key:userKey}, false, function(err, showFeature) {
    if (err) {
      throw err;
      process.exit(1);
    }
    if (showFeature && currentState == "dont_show") {
      console.log(new Date(), "ERROR: showing feature to user despite updating it to not show feature to user");
    } else if (!showFeature && currentState == "show") {
      console.log("ERROR: not showing feature to user despite updating feature to be shown to user");
    }
  });
}, userToggleCheckTick);
