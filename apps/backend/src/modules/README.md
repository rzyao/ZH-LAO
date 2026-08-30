# Domain module boundary

Each business domain is introduced only in its own phase under `src/modules/<domain>/` with `domain`, `application`, `infrastructure`, `http`, and `public` directories.

Another domain may import only from `<domain>/public`. It must never import another domain's `domain`, `application`, `infrastructure`, `http`, or repository implementation. Business modules do not construct PostgreSQL pools or execute SQL from HTTP controllers. Repositories access only their owning schema. Shared access to `infrastructure.assets` and `infrastructure.system_outbox_events` is limited to the Foundation adapters.
