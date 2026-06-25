defmodule ExampleWeb.UnitCase do
  use ExUnit.CaseTemplate

  using do
    quote do
      # The default endpoint for testing
      @endpoint ExampleWeb.Endpoint

      use ExampleWeb, :verified_routes

      import Phoenix.ConnTest
    end
  end

  setup _tags do
    {:ok, conn: Phoenix.ConnTest.build_conn()}
  end
end
