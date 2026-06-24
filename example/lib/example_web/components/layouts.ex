defmodule ExampleWeb.Layouts do
  @moduledoc """
  This module holds layouts and related functionality
  used by your application.
  """
  use ExampleWeb, :html

  # Embed all files in layouts/* within this module.
  # The default root.html.heex file contains the HTML
  # skeleton of your application, namely HTML headers
  # and other static content.
  embed_templates("layouts/*")

  slot(:inner_block, required: true)

  def app(assigns) do
    ~H"""
    <main>
      {render_slot(@inner_block)}
    </main>
    """
  end
end
