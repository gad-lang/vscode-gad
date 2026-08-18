<script setup lang="ts">
import { marked } from "marked";
import readme from "../../README.md?raw";
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
.markdown { max-width: 60rem; line-height: 1.6; }
.markdown h1, .markdown h2 { border-bottom: 1px solid rgba(127,127,127,.3); padding-bottom: .2em; }
.markdown pre { background: rgba(127,127,127,.12); padding: 10px 12px; border-radius: 6px; overflow: auto; }
.markdown code { font-family: monospace; }
</style>
