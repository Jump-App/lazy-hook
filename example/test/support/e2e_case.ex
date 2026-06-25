defmodule ExampleWeb.E2eCase do
  use ExUnit.CaseTemplate

  using do
    quote do
      # The default endpoint for testing
      @endpoint ExampleWeb.Endpoint

      use ExampleWeb, :verified_routes
      use PhoenixTest.Playwright.Case
    end
  end
end
