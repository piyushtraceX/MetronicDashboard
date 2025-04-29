// src/components/Tooltips.js
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";

const Tooltips = () => (
  <Tippy content="This section covers EUDR compliance requirements">
    <button>?</button>
  </Tippy>
);

export default Tooltips;
