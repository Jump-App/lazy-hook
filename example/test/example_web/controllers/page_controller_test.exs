defmodule ExampleWeb.PageControllerTest do
  use ExampleWeb.UnitCase

  test "GET /", %{conn: conn} do
    conn = get(conn, ~p"/")
    assert html_response(conn, 200) =~ "the hook did not successfully load"
  end
end
