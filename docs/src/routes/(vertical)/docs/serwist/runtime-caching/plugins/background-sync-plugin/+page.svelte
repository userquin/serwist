<script lang="ts">
  import CodeTab from "$components/CodeTab.svelte";
  import ICD from "$components/InlineCode.svelte";

  const { data } = $props();
</script>

<h1 id="background-sync-plugin">BackgroundSyncPlugin</h1>
<h2 id="first-added">First added</h2>
<p>Workbox</p>
<h2 id="about">About</h2>
<p>
  A class implementing the <ICD>fetchDidFail</ICD> lifecycle callback. This makes it easier to add failed requests to a
  <ICD><a class="link" href="/docs/serwist/core/background-sync-queue">background sync queue</a></ICD>.
</p>
<h2 id="parameters">Parameters</h2>
<p>
  See
  <a class="link" href="/docs/serwist/core/background-sync-queue#parameters"><ICD>BackgroundSyncQueue</ICD>'s parameters</a>.
</p>
<h2 id="usage">Usage</h2>
<CodeTab codes={data.code.usage} defaultTab="sw.ts" />
