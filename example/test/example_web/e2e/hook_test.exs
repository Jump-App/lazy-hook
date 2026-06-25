defmodule ExampleWeb.E2e.HookTest do
  use ExampleWeb.E2eCase

  test "hook loads", %{conn: conn} do
    conn
    |> visit(~p"/")
    |> assert_has("#example", text: "Hook successfully mounted!", exact: true)
  end
end
