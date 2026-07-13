# Compatibility

| Console | House Protocols | House Runtime API | House Toolkit | Status |
| --- | --- | --- | --- | --- |
| `v0.1.0-alpha.1` | `v0.3.0-rc.2`, document profile `0.2` | `v0.3.0-rc.2` | `v0.3.0-rc.3` publication scan | Initial candidate |

The Console does not infer compatibility from similar version numbers. Its browser client depends on these methods:

- `runtime.health`
- `run.list`
- `run.get`
- `evidence.get`
- `initiative.get`
- `memory.query`
- `lifecycle.query`

Unknown or failed methods remain visible as errors. The Console does not silently replace a failed live response with demo data.

Runtime authentication is a host responsibility and is not part of the protocol request envelope.
