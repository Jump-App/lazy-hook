# Example app

Phoenix example for `lazy-hook`.

To run it:

1. If you changed `../lazy-hook`, rebuild the local package first with `cd ../lazy-hook && bun run pack:local`.
2. Run `cd assets && bun install` to install the local package and Phoenix JS dependencies. Note that you may need to uninstall and then reinstall the local package to make sure bun isn't using a cached copy.
3. Run `mix setup` to install Elixir dependencies.
4. Start the Phoenix endpoint with `mix phx.server`.

Then visit [`localhost:4040`](http://localhost:4040).
