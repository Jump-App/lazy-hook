defmodule ExampleWeb.E2e.HookTest do
  use ExampleWeb.E2eCase

  test "hook loads asynchronously", %{conn: conn} do
    conn
    |> visit(~p"/")
    |> assert_has("#example", text: "Hook successfully mounted asynchronously!", exact: true)
  end
end
