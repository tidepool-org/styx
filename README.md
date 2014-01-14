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
   \"service\": \"myhost-prod\"\
 }],\
 \"anotherHost.tidepool.io\": [{\
   \"service\": \"another-prod\",\
   \"wrappers\": [{\"fn\": \"random\"}]\
 }]\
}
```

This is equivalent to the following JSON, but it must be escaped to allow it to survive the shell

``` json
{"myhost.tidepool.io": [{
   "service": "myhost-prod"
 }],
 "anotherHost.tidepool.io": [{
   "service": "another-prod",
   "wrappers": [{"fn": "random"}]
 }]
}
```

This set of rules can be interpreted as

* If host is `myhost.tidepool.io`, then dispatch to the first entry in the hakken watch for service `myhost-prod`
* If the host is `anotherHost.tidepool.io`, then dispatch to a random entry from the hakken watch for service `another-prod`
* All other requests should receive a 404

So, in summary a rule is essentially two fields

* `service` - the service name for the hakken watch
* `wrappers` - an optional list of wrapper configs that are composed on top of the hakken watch.  Wrappers are composed from the right up, so the right-most wrapper will run first, etc.  The types of wrappers are described below.

In general, you will always want to at least specify a random wrapper.  This was not made a default because I am not willing to assume that there won't be a use case for no wrappers.

### Wrappers

These wrappers are actually defined by hakken and thus using a different version of hakken could result in this list having too much or too little.

#### Random

The random wrapper is defined by

* `fn`: 'random'
* `numToPull` - Numerical, optional (default 1), the number of listings to select randomly.  This can be useful for generating random lists of failover nodes
