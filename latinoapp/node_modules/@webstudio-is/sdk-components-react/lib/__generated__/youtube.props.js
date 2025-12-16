const e = {
  allowFullscreen: {
    description: "Whether to allow fullscreen mode.\nOriginal parameter: `fs`",
    required: !1,
    control: "boolean",
    type: "boolean",
    defaultValue: !0
  },
  autoplay: {
    description: "Whether the video should autoplay.\nSome browsers require the `muted` parameter to be set to `true` for autoplay to work.",
    required: !1,
    control: "boolean",
    type: "boolean",
    defaultValue: !1
  },
  captionLanguage: {
    description: "Specifies the default language that the player will use to display captions.\nThe value is an ISO 639-1 two-letter language code.\nOriginal parameter: `cc_lang_pref`",
    required: !1,
    control: "text",
    type: "string"
  },
  color: {
    description: `Specifies the color that will be used in the player's video progress bar to highlight the amount of the video that the viewer has already seen.
Valid values are 'red' and 'white'.`,
    required: !1,
    control: "radio",
    type: "string",
    options: ["red", "white"]
  },
  disableKeyboard: {
    description: "Whether to disable keyboard controls.\nOriginal parameter: `disablekb`",
    required: !1,
    control: "boolean",
    type: "boolean",
    defaultValue: !1
  },
  endTime: {
    description: "End time of the video in seconds.\nOriginal parameter: `end`",
    required: !1,
    control: "number",
    type: "number"
  },
  inline: {
    description: "Whether to play inline on mobile (not fullscreen).",
    required: !1,
    control: "boolean",
    type: "boolean",
    defaultValue: !1
  },
  keyboard: {
    description: "Whether to enable keyboard controls.",
    required: !1,
    control: "boolean",
    type: "boolean",
    defaultValue: !0
  },
  language: {
    description: "Sets the player's interface language. The value is an ISO 639-1 two-letter language code or a fully specified locale.\nOriginal parameter: `hl`",
    required: !1,
    control: "text",
    type: "string"
  },
  listId: {
    description: "ID of the playlist to load.\nOriginal parameter: `list`",
    required: !1,
    control: "text",
    type: "string"
  },
  listType: {
    description: "Type of playlist to load.",
    required: !1,
    control: "radio",
    type: "string",
    options: ["playlist", "user_uploads"]
  },
  loading: {
    description: "Loading strategy for iframe",
    required: !1,
    control: "radio",
    type: "string",
    defaultValue: "lazy",
    options: ["eager", "lazy"]
  },
  loop: {
    description: "Whether the video should loop continuously.",
    required: !1,
    control: "boolean",
    type: "boolean",
    defaultValue: !1
  },
  muted: {
    description: "Whether the video should start muted.\nUseful for enabling autoplay in browsers that require videos to be muted.\nOriginal parameter: `mute`",
    required: !1,
    control: "boolean",
    type: "boolean",
    defaultValue: !1
  },
  origin: {
    description: "Your domain for API compliance (e.g., `https://yourdomain.com`).",
    required: !1,
    control: "text",
    type: "string"
  },
  playlist: {
    description: "This parameter specifies a comma-separated list of video IDs to play",
    required: !1,
    control: "text",
    type: "string"
  },
  privacyEnhancedMode: {
    description: `The Privacy Enhanced Mode of the YouTube embedded player prevents the use of views of embedded YouTube content from influencing the viewer’s browsing experience on YouTube.
https://support.google.com/youtube/answer/171780?hl=en#zippy=%2Cturn-on-privacy-enhanced-mode`,
    required: !1,
    control: "boolean",
    type: "boolean",
    defaultValue: !0
  },
  referrer: {
    description: "Referrer URL for tracking purposes.\nOriginal parameter: `widget_referrer`",
    required: !1,
    control: "text",
    type: "string"
  },
  showAnnotations: {
    description: "Whether to show annotations on the video.\nOriginal parameter: `iv_load_policy`",
    required: !1,
    control: "boolean",
    type: "boolean",
    defaultValue: !0
  },
  showCaptions: {
    description: "Whether captions should be shown by default.\nOriginal parameter: `cc_load_policy`",
    required: !1,
    control: "boolean",
    type: "boolean",
    defaultValue: !1
  },
  showControls: {
    description: "Whether to show player controls.",
    required: !1,
    control: "boolean",
    type: "boolean",
    defaultValue: !0
  },
  showPreview: { required: !1, control: "boolean", type: "boolean" },
  showRelatedVideos: {
    description: "Whether to show related videos at the end.\nOriginal parameter: `rel`",
    required: !1,
    control: "boolean",
    type: "boolean",
    defaultValue: !0
  },
  startTime: {
    description: "Start time of the video in seconds.\nOriginal parameter: `start`",
    required: !1,
    control: "number",
    type: "number"
  },
  url: {
    description: "The YouTube video URL or ID",
    required: !1,
    control: "text",
    type: "string"
  }
};
export {
  e as props
};
