import { ViewHook } from "phoenix_live_view";

export default class ExampleHook extends ViewHook {
  mounted() {
    this.el.innerText = "Hook successfully mounted!";
  }
}
