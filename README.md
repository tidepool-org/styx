styx
====

Styx is a service that uses hakken to discover services and route requests.

It is essentially a software load balancer, but it integrates with tidepool-org/hakken (and can be extended to integrate with any other service discovery mechanism) to find services.  It also allows for integration with an authentication layer and intelligent forwarding, like consistent hashing.  It is intended as a front-tier layer for a backend API.

## Configuration

Configuration of routes in Hakken are by configuration files.  This is pluggable and will hopefully include things like databases and other sharable backends at some point in the future, but for now it is configuration files.

More details to follow when there is actual code.