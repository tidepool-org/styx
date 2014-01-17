styx
====

Styx is a service that uses hakken to discover services and route requests.

It is essentially a software load balancer, but it integrates with tidepool-org/hakken (and can be extended to integrate with other service discovery mechanisms) to find services.  It also allows for integration with an authentication layer and intelligent forwarding, like consistent hashing.  It is intended as a front-tier layer for a backend API.

## Build

Build and run tests with `build.sh`, requires npm to be installed on the machine.

## Running

Run with `start.sh` after running `build.sh`

## Configuration

Styx can be configured by setting environment variables.  These are all read from `env.js` and there is documentation in there about what the specific values mean.  The only configuration that requires a bit of extra explanation is the rules used for dispatch by styx.  Those are described below.

## Rules

Configuration of routes in Hakken are by configuration files.  This is pluggable and will hopefully include things like databases and other sharable backends at some point in the future, but for now it is configuration files.

Styx configuration is a map of domain to a list of rules.  The protocol for dispatch is

 1) Request comes in
 2) Look at `Host` header and lookup list of rules for host
 3) If list of rules for host does not exist, look for list of rules for "host" `*`
 4) If, list of rules does not exist, return 404.
 5) Else, list of rules does exist, "visit" each rule by passing it the request and response
 6) If a rule returns true, that rule is delegated to and subsequent rules do not run.
 7) If no rule returns true, then a 404 is returned.

The rules follow a JSON grammar, described below.

### Grammar

The basic structure of the `RULES` environment variable should be something like.

```
export RULES=\
{\"myhost.tidepool.io\": [{\
   \"type\": \"random\",\
   \"service\": \"myhost-prod\"\
 }],\
 \"anotherHost.tidepool.io\": [{\
   \"type\": \"random\",\
   \"service\": \"another-prod\"\
 }]\
}
```

This is equivalent to the following JSON, but it must be escaped to allow it to survive the shell

``` json
{"myhost.tidepool.io": [{
   "type": "random",
   "service": "myhost-prod"
 }],
 "anotherHost.tidepool.io": [{
   "type": "random",
   "service": "another-prod"
 }]
}
```

This set of rules can be interpreted as

* If host is `myhost.tidepool.io`, then dispatch to the first entry in the hakken watch for service `myhost-prod`
* If the host is `anotherHost.tidepool.io`, then dispatch to a random entry from the hakken watch for service `another-prod`
* All other requests should receive a 404

A rule will always have one field, `type`, which dictates what other fields are possible on that rule.

* `type` - the type of the ruleservice name for the hakken watch

### Rules

#### Random

The random rule dispatches to a random service instance.

It takes

* `type`: `'random'`
* `service`: The service to watch and proxy for

#### Path Prefix

The path prefix rule will delegate to another rule if the path matches a specific prefix.  This can be coupled with
the random rule to do dispatch based on specific path prefixes.

* `type`: `'pathPrefix'`
* `prefix`: The prefix that should be proxied
* `rule`: The rule that should be delegated to if the prefix matches
* `stripPrefix`: optional (default true), if true, will strip the prefix off of the path before proxying.  Leaves the path alone if false.
