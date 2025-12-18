"use strict";

import { reactive } from "vue";

export const store = reactive({
  pageX: 0,
  pageY: 0,
  activeFragment: null
});
