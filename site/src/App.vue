<script setup lang="ts">
import { useTheme } from "vuetify";
import { marked } from "marked";
import readme from "../../README.md?raw";
const theme = useTheme();
const toggleTheme = () => { theme.global.name.value = theme.global.current.value.dark ? "light" : "dark"; };
const logo = import.meta.env.BASE_URL + "gad.svg";
const readmeHtml = marked.parse(readme) as string;
</script>
<template>
  <v-app>
    <v-app-bar color="surface" flat>
      <v-app-bar-title>
        <img :src="logo" height="24" style="vertical-align:-5px;margin-right:8px" />
        vscode-gad
      </v-app-bar-title>
      <v-spacer />
      <v-btn :icon="theme.global.current.value.dark ? 'mdi-weather-sunny' : 'mdi-weather-night'" @click="toggleTheme" variant="text" title="Toggle theme" />
      <v-btn href="https://marketplace.visualstudio.com/" icon="mdi-microsoft-visual-studio-code" variant="text" />
      <v-btn href="https://github.com/gad-lang/vscode-gad" icon="mdi-github" variant="text" />
    </v-app-bar>
    <v-main>
      <v-container>
        <div class="markdown" v-html="readmeHtml" />
      </v-container>
    </v-main>
  </v-app>
</template>
<style>
/* Restore full markdown typography inside v-html content — Vuetify's global CSS
   reset strips margins, list markers and other element defaults. */
.markdown { max-width: 60rem; line-height: 1.6; overflow-wrap: break-word; }
.markdown > :first-child { margin-top: 0; }
.markdown > :last-child { margin-bottom: 0; }
.markdown p { margin: .75em 0; }
.markdown h1, .markdown h2, .markdown h3, .markdown h4, .markdown h5, .markdown h6 { margin: 1.4em 0 .5em; line-height: 1.25; font-weight: 600; }
.markdown h1 { font-size: 2em; }
.markdown h2 { font-size: 1.5em; }
.markdown h3 { font-size: 1.25em; }
.markdown h4 { font-size: 1.05em; }
.markdown h1, .markdown h2 { border-bottom: 1px solid rgba(127,127,127,.3); padding-bottom: .2em; }
.markdown ul, .markdown ol { padding-left: 1.5em; margin: .5em 0; list-style: revert; }
.markdown li { margin: .25em 0; }
.markdown li > ul, .markdown li > ol { margin: .25em 0; }
.markdown blockquote { margin: .75em 0; padding: .2em 1em; border-left: 3px solid rgba(127,127,127,.4); opacity: .85; }
.markdown a { color: rgb(var(--v-theme-primary)); text-decoration: none; }
.markdown a:hover { text-decoration: underline; }
.markdown hr { border: 0; border-top: 1px solid rgba(127,127,127,.3); margin: 1.5em 0; }
.markdown img { max-width: 100%; }
.markdown table { border-collapse: collapse; margin: .75em 0; display: block; overflow-x: auto; }
.markdown th, .markdown td { border: 1px solid rgba(127,127,127,.3); padding: .4em .6em; text-align: left; }
.markdown th { background: rgba(127,127,127,.1); }
.markdown pre { background: rgba(127,127,127,.12); padding: 10px 12px; border-radius: 6px; overflow: auto; margin: .75em 0; }
.markdown code { font-family: monospace; }
.markdown :not(pre) > code { background: rgba(127,127,127,.15); padding: .1em .35em; border-radius: 4px; font-size: .9em; }
</style>
