defmodule ExampleWeb.HomeLive do
  use ExampleWeb, :live_view

  @impl true
  def render(assigns) do
    ~H"""
    <p id="example" phx-hook="ExampleHook">
      This message is rendered by the server; the hook did not successfully load.
    </p>
    """
  end
end
