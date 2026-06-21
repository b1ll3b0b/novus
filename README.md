# Novus

**A Create-focused progression pack for Minecraft 1.20.1 (Forge).**

Novus builds one connected playthrough out of a handful of big mods rather than
throwing everything at you at once. Create runs the machines and automation.
Tinkers' Construct handles tools and materials. Farmer's Delight turns cooking
into a system of its own, and Quark, Supplementaries, and the Macaw's mods fill
the world with things to build. Magic splits two ways: Botania, the flower-based
path that grows out of the farming side, and Biomancy, the flesh-and-bio path
that wires into Create.

It's a focused pack, not a kitchen sink. There's no combat overhaul, no quest
book to grind through, and no tech tree that races past Create. What ties it all
together is a large set of compatibility mods working quietly in the background
so these systems understand each other.

`Minecraft 1.20.1` · `Forge 47.4.20` · `Java 17` · **<!-- BEGIN:MODCOUNT -->202<!-- END:MODCOUNT --> mods**

---

## What you'll be doing

Novus is built around **five anchor systems** that are wired into each other
rather than sitting side by side:

- **Create** is the spine — rotational machines, contraptions, trains, fluid
  networks, and automated logistics, extended by a deep bench of Create add-ons
  (railways, hypertubes, contraption terminals, decoration, armory, and more).
- **Tinkers' Construct** handles tools and materials with its own tiering path,
  and it's bridged into Create: heat from Create's blaze burners feeds the
  Tinkers melter and alloyer.
- **Farmer's Delight** turns cooking into a full system of crops, dishes, and
  beverages — and Create automation can drive the kitchen through Create: Central
  Kitchen.
- **Quark, Supplementaries, and the Macaw's suite** fill the world with building
  blocks, furniture, and vanilla+ decoration, with the Diagonal mods extending
  the look.
- **Two magic paths that branch in different directions.** Botania grows out of
  the farming side — a flower-based path that sits alongside the agriculture
  stack (AgriCraft, Dynamic Trees, crops). Biomancy is the flesh-and-bio path,
  and it wires into Create through Bio-Factory for bulk processing. Pick one and
  you get a different adjacent specialty.

The progression is implicit rather than gated by a quest book: start vanilla,
build out a Farmer's Delight food chain, climb Tinkers' tool tiers, automate it
all with Create, then branch into Botania or Biomancy — and finish in late-Create
logistics with power loaders, vibrant vaults, and Petrol's parts. Holding it all
together is a large set of **compatibility mods** working quietly in the
background so these systems understand each other's items, heat, and recipes.

**What it isn't:** no combat overhaul, no boss mods, no quest book to grind, and
no tech tree that races past Create (no AE2, Mekanism, or Immersive Engineering).
It's a focused, single-player-tuned playthrough, not a kitchen sink.

---

## Install

**Self-updating (recommended).** Download
**[`novus.zip`](https://b1ll3b0b.github.io/novus/novus.zip)**
and import it into Prism or MultiMC (Add Instance → Import from zip). A small
pre-launch step keeps it current: import once, and every launch pulls the latest
mods and configs for you. That link is permanent and the pack self-updates on
every launch, so it never goes stale.

**Standalone download.** Prefer a fixed version? Grab
`novus-<version>-complete.zip` (client / singleplayer) or
`novus-<version>-server.zip` (dedicated server) from the
[Releases page](https://github.com/b1ll3b0b/novus/releases).

**packwiz.** Point a packwiz-installer at the published `pack.toml`.

---

## Keybinds

Novus ships a tuned, conflict-free keybind layout that applies itself on first
launch. The main keyboard holds the core systems and quality-of-life keys, the
numpad is reserved for extras, and vanilla controls are left alone.

![Novus keybind layout](docs/keybinds.png)

**Dvorak users:** a positional-transpose version of this layout ships alongside the default at `config/defaultoptions/keybindings-dvorak.txt` — every action sits on the same *physical* key as the QWERTY layout above. To use it, replace `config/defaultoptions/keybindings.txt` with that file **before your first launch**. Default Options applies the defaults only once, on first boot, so swapping it afterward won't take effect (you'd just rebind in-game instead).

---

## Lost Cities (optional)

Novus bundles **The Lost Cities** (by McJty) with a custom **`novus`** profile that
overlays sprawling abandoned cities onto the ordinary overworld — the vanilla biome
and terrain layout is untouched, the ruins are laid over the top of it, so vanilla
seeds and structure locations still hold.

In **singleplayer it's off by default.** To play with it, open the **Lost Cities**
customization on the world-creation screen and switch the profile from *Disabled* to
**`novus`** before generating the world. (The menu always starts on *Disabled* — that's
a Lost Cities quirk, not a missing profile; the `novus` profile ships with the pack.)

On the **dedicated server** the `novus` profile is forced on for everyone, so the
whole group shares one city-strewn world.

---

## Requirements & performance

- **Minecraft 1.20.1 · Forge 47.4.20 · Java 17.** The recommended Prism/MultiMC
  install selects the right Java automatically, so there's nothing to set up by
  hand.
- **Memory.** The pack asks for 2 GB minimum and 8 GB maximum out of the box. In
  normal play it settles around 3.5 GB; **6 GB is comfortable**, with the rest as
  headroom for large Create factories and long sessions.
- **Graphics.** Novus isn't a lightweight pack, but it ships a comprehensive
  optimization stack — Embeddium, ImmediatelyFast, EntityCulling, FerriteCore,
  ModernFix, Saturn, and Canary — that keeps it serviceable on integrated
  graphics. **An Intel Iris Xe-class iGPU or better runs it cleanly.**
- **Shaders are optional.** Oculus (an Iris fork) is included, so shaderpacks
  work if you add one; none ship enabled.
- **One harmless quirk:** Simple Clouds needs OpenGL 4.3. On older Intel iGPUs
  that only expose GL 3.2 to 1.20.1 it quietly disables itself — no crash, just no
  custom clouds.

---

## FAQ

**How much RAM should I give it?** 6 GB is comfortable. The pack requests 2–8 GB
and settles around 3.5 GB in normal play, with headroom for big builds.

**Do I need to install Java myself?** No — the recommended Prism/MultiMC install
auto-selects Java 17.

**Will it run on a laptop / integrated graphics?** Yes. It's not a light pack, but
the optimization stack keeps an Iris Xe-class iGPU or better playable.

**Does it update itself?** The recommended `novus.zip` install pulls the latest
mods and configs on every launch. Want a frozen version instead? Grab a standalone
release zip.

**Can I play multiplayer?** Yes — there's a dedicated-server build. The pack is
tuned mainly for single-player, and the server forces the Lost Cities `novus`
world on for everyone.

**Why isn't [some big mod] included?** Novus is deliberately scoped around Create,
Tinkers, Farmer's Delight, and the building/magic systems. Combat overhauls,
quest books, and rival tech trees (AE2, Mekanism, Immersive Engineering) are left
out on purpose — see *What you'll be doing*.

---

## Licensing & credits — please read

Everything below belongs to its original author and is included under that
author's own license. Three things worth knowing up front:

- **Most mods are included as metadata, not files.** For the 183 mods hosted on
  Modrinth, Novus ships only a download link and a file hash. Installing the pack
  fetches each one from its official source, so the pack itself re-hosts nothing
  for those mods.
- **The 19 CurseForge mods are bundled as actual jars.** Automated installers
  can't fetch CurseForge by metadata, so those jars are included directly in the
  pack. Several of them are All Rights Reserved (Waystones, Balm, Quark Delight,
  and others). Credit goes to each author, linked in the table below.
- **Resource packs are bundled as files too**, and some of their source packs are
  All Rights Reserved. See the resource-pack section for the details and a
  release caveat.

The mod count is **202 jars** (183 from Modrinth + 19 from CurseForge) — that's
what the table below lists and what the license tallies count. In-game the loader
reports more (around 264), because a number of those jars bundle their own library
dependencies inside them (Jar-in-Jar); the nested libraries ride along under their
parent mod and aren't listed separately here.

Novus started out aiming to be all open source. In practice it landed at roughly
two-thirds open, with the rest being popular All Rights Reserved content and a
few source-available licenses (Create, Supplementaries, Botania). That mix is
normal for a Forge pack, and it's all disclosed here.

> This isn't legal advice. Licenses were read from each project's listing and/or
> the mod's own metadata, and the trickier ones were checked against the
> project's actual LICENSE file. If you spot a mistake, please open an issue.

**License mix:**

<!-- BEGIN:LICENSEMIX -->
Across all 202 mods:

| License type | Count |
|---|---|
| Open source (MIT, Apache, LGPL/GPL, MPL, BSD, OSL, CC0/CC-BY, etc.) | 135 |
| All rights reserved | 43 |
| Custom / source-available (Create, Supplementaries, Botania, PolyForm, etc.) | 17 |
| Creative Commons non-commercial (Quark family, Jade, the compasses) | 7 |
<!-- END:LICENSEMIX -->

---

## Mods

<!-- BEGIN:MODS -->
_202 mods. This table is generated from the jars and packwiz metadata by `tools/readme/build_readme_credits.py` — don't edit it by hand._

| Mod | Description | Author(s) | License | Source |
|---|---|---|---|---|
| Advancement Plaques | Replaces standard advancement toasts with fancy plaques. | Grend | CC BY-NC-ND 4.0 | [Modrinth](https://modrinth.com/mod/advancementplaques) |
| AgriCraft | Agricultural farming extended | InfinityRaider, Ketheroth | MIT | [Modrinth](https://modrinth.com/mod/agricraft) |
| Amendments | Many tweaks to Vanilla Blocks | MehVahdJukaar | Custom — Supplementaries Team License [^1] | [Modrinth](https://modrinth.com/mod/amendments) |
| Another Furniture | Decorating your home just got better! | Starfish Studios | Custom [^2] | [Modrinth](https://modrinth.com/mod/another-furniture) |
| Antique Atlas | A hand-drawn world map with biomes, structures, waypoints, and less! | Hunternif, tyra314, Sisby folk. Contributions by Kenkron, asiekierka, Haven King, TheCodeWarrior, osipxd, coolAlias, TehNut, lumiscosity, frodolon | LGPL-3.0-or-later | [Modrinth](https://modrinth.com/mod/antique-atlas-4) |
| AppleSkin | Adds various food-related HUD improvements | squeek | Unlicense | [Modrinth](https://modrinth.com/mod/appleskin) |
| Architectury | A intermediary api aimed to ease developing multiplatform mods. | shedaniel | LGPL-3.0-only | [Modrinth](https://modrinth.com/mod/architectury-api) |
| Argonauts | A guild and party mod to work and play together with your teammates on a server! | Alex Nijjar, ThatGravyBoat | MIT | [Modrinth](https://modrinth.com/mod/argonauts) |
| Auroras | Adding magnificent auroras to the world! | Verph | BSD-2-Clause | [Modrinth](https://modrinth.com/mod/auroras) |
| Backpacked | A vanilla-friendly backpack mod, featuring an unlock-based progression system, special augments that can be appl… | MrCrayfish | LGPL-2.1-only | [CurseForge](https://www.curseforge.com/minecraft/mc-mods/backpacked) |
| Balm | Abstraction Layer (but not really)™ for Blay's multiplatform mods | BlayTheNinth | All Rights Reserved | [CurseForge](https://www.curseforge.com/minecraft/mc-mods/balm) |
| Bartering Station | Still running around bartering manually? Let's put those lazy piglins to work instead! | Fuzs | MPL-2.0 | [Modrinth](https://modrinth.com/mod/bartering-station) |
| Better Combat | Easy, spectacular and fun melee combat system from Minecraft Dungeons. | Daedelus | GPL-3.0 [^3] | [Modrinth](https://modrinth.com/mod/better-combat) |
| Better Third Person | Adds independent camera rotation for third-person view | Socolio | All Rights Reserved | [Modrinth](https://modrinth.com/mod/better-third-person) |
| BetterDays | Gives you control over the passage of time by allowing you to customize the length of the day-night cycle and al… | wendall911 | LGPL-3.0-or-later | [Modrinth](https://modrinth.com/mod/betterdays) |
| Bio-Factory | Bio-Factory is a addon mod for Biomancy X Create | Elenterius | MIT | [Modrinth](https://modrinth.com/mod/biofactory) |
| Biomancy 2 | Biopunk and Flesh Magic inspired tech-magic mod that has a fleshy art theme. | Elenterius, RhinoW | MIT | [Modrinth](https://modrinth.com/mod/biomancy) |
| Biomantic Delight | Farmer's Delight addon — dishes themed around Biomancy's flesh ingredients. | thesh, MCreator | All Rights Reserved | [Modrinth](https://modrinth.com/mod/bio-delight) |
| Bookshelf | A library for building other mods. | Darkhax | LGPL-2.1-only | [Modrinth](https://modrinth.com/mod/bookshelf-lib) |
| Botania | Botania is a mod that adds nature magic to Minecraft. | Vazkii, wiiv, williewillus, dylan4ever, Hubry, Alwinfy, artemisSystem, Falkory220 | Custom — Botania License | [Modrinth](https://modrinth.com/mod/botania) |
| Bountiful | Bountiful adds bounty boards to the world. | Ejektaflex | GPL-3.0 [^4] | [Modrinth](https://modrinth.com/mod/bountiful) |
| Brewin' And Chewin' | Fermenting addon for Farmer's Delight. | Probleyes, Umpaz, MerchantPug | MIT | [Modrinth](https://modrinth.com/mod/brewin-and-chewin) |
| Cadmus | A land claiming mod that allows users to claim land to protect your home from thieves, bandits and monsters, and… | Alex Nijjar, ThatGravyBoat | MIT | [Modrinth](https://modrinth.com/mod/cadmus) |
| Canary | A performance mod designed to optimize Minecraft's general performance and unofficial fork of Lithium mod for Mi… | AbdElAziz | LGPL-3.0-only | [Modrinth](https://modrinth.com/mod/canary) |
| Catalogue | A new and improved mod list with a modern design | MrCrayfish | MIT | [CurseForge](https://www.curseforge.com/minecraft/mc-mods/catalogue) |
| Ceramics | Mod adding additional early game and vanilla-like tools made of clay. | KnightMiner | MIT | [Modrinth](https://modrinth.com/mod/ceramics) |
| Chalk | Leave the mark. | mortuusars | MIT | [Modrinth](https://modrinth.com/mod/chalk-mod) |
| Chefs Delight | Add-on for Farmer's Delight Mod. Adds 2 new professions to villagers. Chef and Cook. | Redstone Games | MIT | [Modrinth](https://modrinth.com/mod/chefs-delight) |
| Cherished Worlds | Favorite/pin/bookmark certain worlds, which will always be at the top of the list and cannot be deleted. | Illusive Soulworks | LGPL-3.0-or-later | [Modrinth](https://modrinth.com/mod/cherished-worlds) |
| Chunky | Pre-generates chunks, quickly, efficiently, and safely | pop4959 | GPL-3.0 | [Modrinth](https://modrinth.com/mod/chunky) |
| Cloth Config v10 API | An API for config screens. | shedaniel | LGPL-3.0-only | [Modrinth](https://modrinth.com/mod/cloth-config) |
| Collective | Collective is a shared library with common code for all of Serilum's mods. | Rick South | All Rights Reserved | [Modrinth](https://modrinth.com/mod/collective) |
| Comforts | Adds sleeping bags and hammocks for, respectively, portability and turning day to night, without setting new spa… | Illusive Soulworks | LGPL-3.0-or-later | [Modrinth](https://modrinth.com/mod/comforts) |
| Compat Delight | Adds compatibility between popular mods and Farmer's Delight. | FixerLink | All Rights Reserved | [Modrinth](https://modrinth.com/mod/compat-delight) |
| Configured | Creates a simple GUI config for every mod! | MrCrayfish | LGPL-3.0-only | [CurseForge](https://www.curseforge.com/minecraft/mc-mods/configured) |
| Controllable | Adds the ability to use a controller to play Minecraft | MrCrayfish | MIT | [CurseForge](https://www.curseforge.com/minecraft/mc-mods/controllable) |
| Controlling | Adds the ability to search for keybinds using their name in the KeyBinding menu, this allows players to easily f… | Jaredlll08 | MIT | [Modrinth](https://modrinth.com/mod/controlling) |
| CraftTweaker | Customize your minecraft experience! | Jaredlll08, Kindlich, StanHebben and TheSilkMiner | MIT | [Modrinth](https://modrinth.com/mod/crafttweaker) |
| Create | Technology that empowers the player. | simibubi | Custom — Create Mod License [^6] | [Modrinth](https://modrinth.com/mod/create) |
| Create Contraption Terminals | Allows Tom's Simple Storage Terminals to work on Create contraptions. | tom5454 | MIT | [Modrinth](https://modrinth.com/mod/create-contraption-terminals) |
| Create Crafts & Additions | Create Crafts & Additions extends Create and acts as a bridge between electric and kinetic energy from Create. | MRH0 | MIT | [Modrinth](https://modrinth.com/mod/createaddition) |
| Create Deco | Decorative options for your Create factory | Kayla, Talrey, Ordana, Cassian | CC0-1.0 [^9] | [Modrinth](https://modrinth.com/mod/create-deco) |
| Create Enchantment Industry | Automatic Enchanting, with Create. | MarbleGateKeeper & LimonBlaze | LGPL-3.0-only [^7] | [Modrinth](https://modrinth.com/mod/create-enchantment-industry) |
| Create Hypertube | Adding a new way to move in your world | Rok | Apache-2.0 | [Modrinth](https://modrinth.com/mod/hypertube) |
| Create Jetpack | Upgrade your backtank and utilize the pressurized air to fly | possible_triangle | Custom (source-available) [^8] | [Modrinth](https://modrinth.com/mod/create-jetpack) |
| Create Recycle Everything | Recycle useless items, have more free space in chests. | NoCube | All Rights Reserved | [CurseForge](https://www.curseforge.com/minecraft/mc-mods/create-recycle-everything) |
| Create: Bells & Whistles | Create: Bells & Whistles is an add-on for the Create mod that focuses on the player experience, adding various n… | lev | GPL-3.0-or-later | [Modrinth](https://modrinth.com/mod/bellsandwhistles) |
| Create: Blaze Burner Fuels | This mod adds a variety of items and recipes to Create, introducing new fuel sources for Blaze Burners and givin… | robinfrt | All Rights Reserved | [Modrinth](https://modrinth.com/mod/create-blaze-burner-fuels) |
| Create: Central Kitchen | An add-on for Create, providing automation support for Farmer's Delight and its add-ons. | LimonBlaze, MarbleGate and Etherwood | LGPL-3.0-only [^7] | [Modrinth](https://modrinth.com/mod/btq68HMO) |
| Create: Connected | Quality-of-life blocks that you wish existed in Create. | Lysine | AGPL-3.0-or-later | [Modrinth](https://modrinth.com/mod/create-connected) |
| Create: Copycats+ | All the copycats you've ever wanted, combined into a single mod! | Lysine, Bennyboy1695, Redcat_XVIII | All Rights Reserved | [Modrinth](https://modrinth.com/mod/copycats) |
| Create: Diesel Generators | A mod that adds Diesel Generators, Crude Oil, Chemical Weapons, Lighters, Decorative Blocks and more... | George VI | MIT | [Modrinth](https://modrinth.com/mod/create-diesel-generators) |
| Create: Escalated | Bringing you to higher places in your Create mod builds | rbasamoyai | MIT | [Modrinth](https://modrinth.com/mod/escalated) |
| Create: Power Loader | Mechanical chunk loaders for Create. | Lysine | MIT | [Modrinth](https://modrinth.com/mod/create-power-loader) |
| Create: Sound of Steam | Adds pipe organs to Create. | FinchyMcFinch, Deanosaur75 | MIT [^12] | [Modrinth](https://modrinth.com/mod/create-sound-of-steam) |
| Create: Steam 'n' Rails | Customization and extension of Create rail systems and steam system | The Railways Team | LGPL-3.0-only | [Modrinth](https://modrinth.com/mod/create-steam-n-rails) |
| Create: Vibrant Vaults | Adds more item vaults to Create. | ZLT | MIT | [Modrinth](https://modrinth.com/mod/create-vibrant-vaults) |
| CreateArmory | Create Armory adds new weapons based on real life and ficitonal firearams | dcchill | All Rights Reserved | [Modrinth](https://modrinth.com/mod/create-armory) |
| Curios API | A flexible and expandable accessory/equipment API for users and developers. | C4 | LGPL-3.0-or-later | [Modrinth](https://modrinth.com/mod/curios) |
| Default Options | A way for modpacks to ship a default (key) configuration without having to include an options.txt file. | BlayTheNinth | All Rights Reserved | [Modrinth](https://modrinth.com/mod/default-options) |
| Diagonal Fences | Fences connecting diagonally? Wait. That's illegal. | Fuzs, XFactHD | MPL-2.0 | [Modrinth](https://modrinth.com/mod/diagonal-fences) |
| Diagonal Walls | The missing diagonal blocks are here! After all these years. Finally, you have them all. | Fuzs, XFactHD | MPL-2.0 | [Modrinth](https://modrinth.com/mod/diagonal-walls) |
| Diagonal Windows | Now windows are connecting diagonally, too?! This is getting out of hand! | Fuzs, XFactHD | MPL-2.0 | [Modrinth](https://modrinth.com/mod/diagonal-windows) |
| Dynamic Trees | Progressively growing trees.. forests that spread | Ferreusveritas | MIT | [Modrinth](https://modrinth.com/mod/dynamictrees) |
| Dynamic Trees for Quark | Compatibility Mod between Dynamic trees and Quark | Max Hyper | MIT | [Modrinth](https://modrinth.com/mod/dynamic-trees-quark) |
| Dynamic Trees for Tinker's Construct | Compatibility Mod between Dynamic trees and Tinker's Construct | Max Hyper | MIT | [CurseForge](https://www.curseforge.com/minecraft/mc-mods/dynamic-trees-tinkers-construct) |
| Dynamic Trees Plus | Vanilla addon for Dynamic Trees | Ferreusveritas, Max Hyper/supermassimo, Harley O'Connor | MIT | [Modrinth](https://modrinth.com/mod/dynamictreesplus) |
| Embeddium | Embeddium is a fork of Rubidium, a fork of Sodium with patches for Forge | embeddedt | LGPL-3.0-only | [Modrinth](https://modrinth.com/mod/embeddium) |
| EMI | A featureful and accessible item and recipe viewer | Emi | MIT | [Modrinth](https://modrinth.com/mod/emi) |
| EnchantmentDescriptions | Adds descriptions of enchantments to their tooltip. | Darkhax | LGPL-2.1-only | [Modrinth](https://modrinth.com/mod/enchantment-descriptions) |
| EnderChests | Adds linked Chests and Bags that share inventory. | ShetiPhian; Artwork: Fruzstrated | All Rights Reserved | [Modrinth](https://modrinth.com/mod/enderchests) |
| EnderTanks | Adds linked Tanks and Buckets that share inventory. | ShetiPhian; Artwork: Fruzstrated | All Rights Reserved | [Modrinth](https://modrinth.com/mod/endertanks) |
| Entity Model Features | This is an expansion of the ETF mod, it adds support for OptiFine format Custom Entity Model (CEM) resource packs. | Traben | LGPL-3.0-only | [Modrinth](https://modrinth.com/mod/entity-model-features) |
| Entity Texture Features | Adds support for resource-pack driven features for entity textures including some OptiFine features Supports Opt… | Traben | LGPL-3.0-only | [Modrinth](https://modrinth.com/mod/entitytexturefeatures) |
| EntityCulling | This mod uses async path-tracing to hide Tiles/Entities that are not visible. | tr7zw | Custom — tr7zw Protective License | [Modrinth](https://modrinth.com/mod/entityculling) |
| Every Compat | Ultimate Wood Compat Mod | MehVahdJukaar, Xel'Bayria, WenXin2 | Custom — Supplementaries Team License [^1] | [Modrinth](https://modrinth.com/mod/every-compat) |
| Explorer's Compass | Search for and locate structures anywhere in the world. | ChaosTheDude | CC-BY-NC-SA-4.0 | [Modrinth](https://modrinth.com/mod/explorers-compass) |
| Exposure | Camera mod with focus on process and aesthetics. | mortuusars | MIT | [Modrinth](https://modrinth.com/mod/exposure) |
| Exposure Polaroid | Addon for Exposure that adds Instant Camera | mortuusars | MIT | [Modrinth](https://modrinth.com/mod/exposure-polaroid) |
| FA Player Extension Compat | Compatibility mod between FA: Player Extension resource pack and other mods. | ArimoV2 | MPL-2.0 | [Modrinth](https://modrinth.com/mod/fa-player-extension-compat) |
| Farmer's Delight | A cozy farming and cooking expansion for Minecraft! | vectorwing | MIT | [Modrinth](https://modrinth.com/mod/farmers-delight) |
| Farmer's Delight: Plus | Farmer's Delight addon, that adds a lot of new delicious meals in a vanilla style | Johnyele | MIT | [Modrinth](https://modrinth.com/mod/farmers-delight-plus) |
| Farmer's Respite | An addon for the Farmer's Delight mod centered around brewing tea and coffee in the kettle | Umpaz, Probleyes | MIT | [CurseForge](https://www.curseforge.com/minecraft/mc-mods/farmers-respite) |
| Ferrite Core | Reduces memory usage. | malte0811 | MIT | [Modrinth](https://modrinth.com/mod/ferrite-core) |
| Forgified Fabric API | Core API module providing key hooks and intercompatibility features. | FabricMC, Sinytra | Apache-2.0 | [Modrinth](https://modrinth.com/mod/forgified-fabric-api) |
| Framework | A library providing powerful utilities for developers | MrCrayfish | LGPL-2.1-only | [CurseForge](https://www.curseforge.com/minecraft/mc-mods/framework) |
| Freecam | A highly customizable freecam mod. | hashalite | MIT | [Modrinth](https://modrinth.com/mod/freecam) |
| Fright's Delight | Fright's Delight is an add-on mod for Farmer's Delight that adds food made from mob drops. | ChefMooon | MIT | [Modrinth](https://modrinth.com/mod/frights-delight) |
| Fusion | Fusion allows resource packs to use additional texture and model types such as connected textures! | SuperMartijn642 | All Rights Reserved | [Modrinth](https://modrinth.com/mod/fusion-connected-textures) |
| Fzzy Config | Configuration engine with automatic GUI generation, client-server syncing, powerful validation and error handlin… | fzzyhmstrs | Custom — TDL-M | [Modrinth](https://modrinth.com/mod/fzzy-config) |
| Gabou's Libs | Shared library code for Gabou's mods. | Gabou | All Rights Reserved | [Modrinth](https://modrinth.com/mod/gabous-libs) |
| GeckoLib 4 | GeckoLib is an animation engine for Minecraft Mods, with support for complex 3D keyframe-based animations, 30+ e… | Gecko, Eliot, AzureDoom, DerToaster, Tslat, Witixin | MIT | [Modrinth](https://modrinth.com/mod/geckolib) |
| GlitchCore | A library mod aimed at abstracting mod loaders and providing various utilities for our mods. | Adubbz | All Rights Reserved | [Modrinth](https://modrinth.com/mod/glitchcore) |
| Goblin Traders | Adds goblins that have unique trades to improve your adventure! | MrCrayfish | MIT | [CurseForge](https://www.curseforge.com/minecraft/mc-mods/goblin-traders) |
| Golem Overhaul | Golem overhaul adds awesome Golems! | Alex Nijjar, Joosh, 3xpl01t | All Rights Reserved | [Modrinth](https://modrinth.com/mod/qEYs2G9A) |
| Hide Experimental Warning | Hides the Experimental Settings Warning when trying to create or load a perfectly fine modded world. | Rick South | All Rights Reserved | [Modrinth](https://modrinth.com/mod/hide-experimental-warning) |
| Hyperbox | The Hyperbox mod adds a block that's bigger on the inside than it is on the outside. | Commoble | MIT | [Modrinth](https://modrinth.com/mod/hyperbox) |
| Iceberg | A library containing events, helpers, and utilities to make modding easier. | Grend | CC BY-NC-ND 4.0 | [Modrinth](https://modrinth.com/mod/iceberg) |
| ImmediatelyFast | Speed up and optimize immediate mode rendering in Minecraft | RK_01 | LGPL-3.0-only | [Modrinth](https://modrinth.com/mod/immediatelyfast) |
| Immersive Gateways | Ancient gateways connecting the world in an immersive way, preserving exploration and encouraging traditional tr… | Luke100000 | GPL-3.0 | [Modrinth](https://modrinth.com/mod/immersive-gateways) |
| Infinity Buttons | A mod which adds new exciting buttons! | LarsMans | MIT | [Modrinth](https://modrinth.com/mod/infinitybuttons) |
| Initial Inventory | Lets you define custom starting items with CraftTweaker | Jaredlll08 | MIT | [CurseForge](https://www.curseforge.com/minecraft/mc-mods/initial-inventory) |
| Jade | Minecraft mod shows what you are looking at. (Hwyla fork) | Snownee | CC-BY-NC-SA-4.0 | [Modrinth](https://modrinth.com/mod/jade) |
| Jade Addons | Jade additional mod supports | Snownee | All Rights Reserved | [Modrinth](https://modrinth.com/mod/jade-addons-forge) |
| Json Things | Things, in JSON sauce. | gigaherz | BSD-3-Clause | [CurseForge](https://www.curseforge.com/minecraft/mc-mods/json-things) |
| Just Enough Breeding | JEI/REI/EMI plugin that displays breeding information | Christofmeg | MIT | [Modrinth](https://modrinth.com/mod/justenoughbreeding) |
| Just Enough Effects Descriptions | REI/JEI addon that shows effects and their descriptions | MehVahdJukaar | All Rights Reserved | [Modrinth](https://modrinth.com/mod/just-enough-effect-descriptions-jeed) |
| Just Enough Professions (JEP) | Adds info about professions to JEI | Mrbysco, ShyNieke | MIT | [Modrinth](https://modrinth.com/mod/just-enough-professions-jep) |
| Kambrik | A Light-weight Kotlin Library Mod! | enjarai | MPL-2.0 [^10] | [Modrinth](https://modrinth.com/mod/kambrik) |
| Kotlin For Forge | Kotlin language runtime and adapter for Forge mods. | — | LGPL-2.1-only | [Modrinth](https://modrinth.com/mod/kotlin-for-forge) |
| KubeJS | Customize your modpack or server with JavaScript! | LatvianModder | LGPL-3.0-only | [Modrinth](https://modrinth.com/mod/kubejs) |
| KubeJS Addditions (Forge) | A mod that adds a bunch of additional features to KubeJS. | ILIKEPIEFOO2 | All Rights Reserved [^11] | [Modrinth](https://modrinth.com/mod/kubejs-additions) |
| KubeJS Create | KubeJS Create integration | LatvianModder | LGPL-3.0-only | [Modrinth](https://modrinth.com/mod/kubejs-create) |
| KubeJSDelight | FD integration for KubeJS | QinomeD, Bob Varioa | LGPL-3.0-only | [CurseForge](https://www.curseforge.com/minecraft/mc-mods/kubejs-delight) |
| Leaves Be Gone | Quick leaf decay from cutting down trees. Built for great performance and mod compat! | Fuzs | MPL-2.0 | [Modrinth](https://modrinth.com/mod/leaves-be-gone) |
| Legendary Tooltips | Gives rare items a fancy tooltip and adds additional tooltip configuration options. | Grend | CC BY-NC-ND 4.0 | [Modrinth](https://modrinth.com/mod/legendary-tooltips) |
| Lighty | The Light Overlay Mod with a twist! | andi_makes, agnor99 | Apache-2.0 | [Modrinth](https://modrinth.com/mod/lighty) |
| LostCities | Generate cities all over the world | McJty | MIT | [Modrinth](https://modrinth.com/mod/8VDCUS3b) |
| Macaw's Bridges | Connect the world with bridges! | Sketch Macaw & Peachy Macaw | All Rights Reserved | [Modrinth](https://modrinth.com/mod/macaws-bridges) |
| Macaw's Doors | Adds a lot of new Doors! With vanila and unique styles. | Sketch Macaw & Sketch Peachy | MIT | [Modrinth](https://modrinth.com/mod/macaws-doors) |
| Macaw's Fences and Walls | Adds new vanila styled fences, walls and gates. | Sketch Macaw & Peachy Macaw | MIT | [Modrinth](https://modrinth.com/mod/macaws-fences-and-walls) |
| Macaw's Holidays | Adds 250+ Christmas Decorations and 80+ Halloween Decorations | Sketch Macaw & Peachy Macaw | All Rights Reserved | [Modrinth](https://modrinth.com/mod/macaws-holidays) |
| Macaw's Lights and Lamps | Make your worlds brighter with lamps, tiki torches, paper lamps and more! | Sketch Macaw & Peachy Macaw | All Rights Reserved | [Modrinth](https://modrinth.com/mod/macaws-lights-and-lamps) |
| Macaw's Paths and Pavings | Adds new vanila styled paths and pavings! | Sketch Macaw & Peachy Macaw | MIT | [Modrinth](https://modrinth.com/mod/macaws-paths-and-pavings) |
| Macaw's Roofs | Build roofs, awnings, rain gutters and more! | Sketch Macaw & Sketch Peachy | All Rights Reserved | [Modrinth](https://modrinth.com/mod/macaws-roofs) |
| Macaw's Stairs and Balconies | New Stairs, Handrails for Stairs, Balconies! | Sketch Macaw & Sketch Peachy | All Rights Reserved | [Modrinth](https://modrinth.com/mod/macaws-stairs) |
| Macaw's Trapdoors | Adds lots of different Trapdoors! With vanila and unique styles. | Sketch Macaw & Peachy Macaw | MIT | [Modrinth](https://modrinth.com/mod/macaws-trapdoors) |
| Macaw's Windows | Build Windows, Sills, Blinds, Shutters, Mosaic Windows and more! | Sketch Macaw & Peachy Macaw | All Rights Reserved | [Modrinth](https://modrinth.com/mod/macaws-windows) |
| Mantle | Shared code for Slime Knights mods and others. | Slime Knights | MIT | [Modrinth](https://modrinth.com/mod/mantle) |
| Map Atlases | A vanilla-friendly mini-map/world-view mod using vanilla Maps, introducing the Atlas | MehVahdJukaar, Pepperoni__Jabroni__ | GPL-3.0 | [Modrinth](https://modrinth.com/mod/map-atlases-forge) |
| Miner's Delight | A Farmer's Delight addon focused on adding more food variety to caves! | Sammy; | All Rights Reserved | [Modrinth](https://modrinth.com/mod/miners-delight) |
| MmmMmmMmmMmm | Adds a target dummy for testing weapons, damage, and redstone. | MehVahdJukaar, Bonusboni, Plantkillable | CC0-1.0 | [Modrinth](https://modrinth.com/mod/mmmmmmmmmmmm) |
| ModernFix | Egregious, yet effective performance improvements for modern Minecraft | embeddedt | LGPL-3.0-only | [Modrinth](https://modrinth.com/mod/modernfix) |
| Moonlight Library | A small library with many cool unique features, from dynamic asset generation to dynamic villager schedules and… | MehVahdJukaar | Custom — LGPL + dependency clause | [Modrinth](https://modrinth.com/mod/moonlight) |
| More Create Burners | A mod that adds more burners into the game for alternatives of the blaze burner in the Create mod. | Dragon Egg | All Rights Reserved | [Modrinth](https://modrinth.com/mod/more-create-burners) |
| More Red | This mod adds a bunch of redstone logic gate plate blocks. | Commoble | MIT | [Modrinth](https://modrinth.com/mod/more-red) |
| Mouse Tweaks | A mod that enhances the inventory management by adding various additional functions to the usual mouse buttons. | Ivan Molodetskikh (YaLTeR) | BSD-3-Clause | [Modrinth](https://modrinth.com/mod/mouse-tweaks) |
| Nature's Compass | Search for a biome and get information about it. | ChaosTheDude | CC-BY-NC-SA-4.0 | [Modrinth](https://modrinth.com/mod/natures-compass) |
| Oculus | Unofficial Fork of "Iris", made to work with FML | NanoLive, dima_dencep, coderbot, IMS212, Justsnoopy30, FoundationGames | LGPL-3.0-only | [Modrinth](https://modrinth.com/mod/oculus) |
| Particle Rain | Replaces weather with prettier particle effects | pigcart | MIT | [Modrinth](https://modrinth.com/mod/particle-rain) |
| Patchouli | Accessible, Data-Driven, Dependency-Free Documentation for Minecraft Modders and Pack Makers | Vazkii | CC-BY-NC-SA-3.0 | [Modrinth](https://modrinth.com/mod/patchouli) |
| Paxi | Drag-and-drop your data packs and let Paxi do the rest! Global data packs made easy. | YUNGNICKYOUNG | LGPL-3.0-only | [Modrinth](https://modrinth.com/mod/paxi) |
| Pehkui | Allows resizing of most entities. | Virtuoel | MIT | [Modrinth](https://modrinth.com/mod/pehkui) |
| Petrol's Parts | New and unique kinetic components for Create. | petrolpark | All Rights Reserved | [Modrinth](https://modrinth.com/mod/petrols-parts) |
| Petrolpark's Library | Common code for petrolpark's Create add-ons and other Minecraft mods. | petrolpark | All Rights Reserved | [Modrinth](https://modrinth.com/mod/petrolpark) |
| Placebo | Shared library for Shadows_of_Fire's mods. | Shadows_of_Fire | MIT | [CurseForge](https://www.curseforge.com/minecraft/mc-mods/placebo) |
| Player Animator | Library for playing custom keyframe player animations. | KosmX | MIT | [Modrinth](https://modrinth.com/mod/playeranimator) |
| Plenty Plates | Many new pressure plates for all your redstone needs. Greatly customizable! | Fuzs | MPL-2.0 | [Modrinth](https://modrinth.com/mod/plenty-plates) |
| PolyLib | Shared library for CreeperHost's mods. | CreeperHost | BSD-4-Clause [^13] | [Modrinth](https://modrinth.com/mod/polylib) |
| Polymorph | No more recipe conflicts! Adds an option to choose the crafting result if more than one is available. | Illusive Soulworks | LGPL-3.0-or-later | [Modrinth](https://modrinth.com/mod/polymorph) |
| PonderJS | Allows creating ponder scenes and tags with KubeJS. | kotakotik22, AlmostReliable | MIT | [Modrinth](https://modrinth.com/mod/ponder) |
| Powah | Various ways to generate, store and transmit FE power. | owmii,Technici4n | LGPL-3.0-only | [Modrinth](https://modrinth.com/mod/powah) |
| Prism | A library all about color! Provides lots of color-related functionality for dependent mods. | Grend | CC BY-NC-ND 4.0 | [Modrinth](https://modrinth.com/mod/prism-lib) |
| Puzzles Lib | Why's it called Puzzles you ask? That's the puzzle! | Fuzs | MPL-2.0 | [Modrinth](https://modrinth.com/mod/puzzles-lib) |
| Quark | Small things, improving Minecraft bit by bit. | Vazkii, WireSegal, MCVinnyq, Sully | CC-BY-NC-SA-3.0 | [Modrinth](https://modrinth.com/mod/quark) |
| Quark Delight | Adds Quark and Farmer's Delight compat | NoCube | All Rights Reserved | [CurseForge](https://www.curseforge.com/minecraft/mc-mods/quark-delight) |
| Quark Oddities | Crazier Small things. | Vazkii, WireSegal, MCVinnyq, Sully | CC-BY-NC-SA-3.0 | [Modrinth](https://modrinth.com/mod/quark-oddities) |
| Rainbow Lamp | A Redstone Lamp which changes color dependent on its Redstone input. Right-click to cycle through all colors | LaidBackSloth | MIT | [Modrinth](https://modrinth.com/mod/pCWLDHSQ) |
| Rainbows | Adding magnificent rainbows to the world! | Verph | BSD-2-Clause | [Modrinth](https://modrinth.com/mod/rainboows) |
| Repurposed Structures | Adds more variations of vanilla structures and features! | TelepathicGrunt | LGPL-3.0-only | [Modrinth](https://modrinth.com/mod/repurposed-structures-forge) |
| Resourceful Lib | Team Resourceful Library | ThatGravyBoat, Epic_Oreo | MIT | [Modrinth](https://modrinth.com/mod/resourceful-lib) |
| Resourcefulconfig | A library for creating config files for your mod across multiple platforms. | ThatGravyBoat, Epic_Oreo | MIT [^14] | [Modrinth](https://modrinth.com/mod/resourceful-config) |
| Rhino | A fork of Mozilla's Rhino library, modified for use in mods | latvian.dev, Mozilla | MPL-2.0 | [Modrinth](https://modrinth.com/mod/rhino) |
| Saturn | A performance optimization mod designed to optimize Minecraft's memory usage. | AbdElAziz | LGPL-3.0-only | [Modrinth](https://modrinth.com/mod/saturn) |
| Scarecrows' Territory | Scarecrows' Territory keeps spawners activated! | SuperMartijn642 | All Rights Reserved | [Modrinth](https://modrinth.com/mod/scarecrows-territory) |
| Searchables | A library mod to facilitate adding search bars with auto complete and search types. | Jaredlll08 | MIT | [Modrinth](https://modrinth.com/mod/searchables) |
| Serene Seasons | Adds seasons with changing colors, temperature shifting, and more! | Adubbz, Forstride | All Rights Reserved | [Modrinth](https://modrinth.com/mod/serene-seasons) |
| Serene Seasons Plus | Addon to Serene Seasons. | Gabou | All Rights Reserved | [Modrinth](https://modrinth.com/mod/serene-seasons-plus) |
| ShetiPhian-Core | Core set of files needed by ShetiPhian's mods | ShetiPhian, Artwork: Fruzstrated | All Rights Reserved | [Modrinth](https://modrinth.com/mod/shetiphiancore) |
| Simple Clouds | A mod overhauling Minecraft's cloud system | nonamecrackers2 | PolyForm Perimeter 1.0.1 | [Modrinth](https://modrinth.com/mod/simple-clouds) |
| Simple Clouds Compat | Adds compatibility between Simple Clouds' localized weather system and other mods that adds blocks which detect… | RedCraft86 | MIT | [Modrinth](https://modrinth.com/mod/simple-clouds-compat) |
| Simple Voice Chat | A working voice chat in Minecraft! | Max Henkel | All Rights Reserved | [Modrinth](https://modrinth.com/mod/simple-voice-chat) |
| Sinytra Connector | Runs Fabric mods on Forge; here it loads the pack's Fabric-only map mods. | Sinytra | MIT [^5] | [Modrinth](https://modrinth.com/mod/connector) |
| Sodium Dynamic Lights | Fork of LambDynLights to work with Sodium on Neoforge 1.21+ | toni, LambdAurora | MIT | [Modrinth](https://modrinth.com/mod/sodium-dynamic-lights) |
| Sodium Options API | Cross-platform Sodium config event API for Sodium 1.21 and Embeddium 1.20 | toni | LGPL-3.0-only | [Modrinth](https://modrinth.com/mod/sodium-options-api) |
| Sound Physics Remastered | Provides realistic sound attenuation, reverberation, and absorption through blocks. | Sonic Ether, vlad2305m, Max Henkel, Saint | GPL-3.0 | [Modrinth](https://modrinth.com/mod/sound-physics-remastered) |
| Spice of Life: Classic Edition | Eating the same food will cause the recovery level to decrease. | leopoko | MIT | [Modrinth](https://modrinth.com/mod/foodvariations) |
| Storage Drawers | Interactive compartment storage for your workshops | Texelsaur | MIT | [Modrinth](https://modrinth.com/mod/storagedrawers) |
| Subtle Effects | Adding many new subtle details through particles and a few sounds | MincraftEinstein | All Rights Reserved | [Modrinth](https://modrinth.com/mod/subtle-effects) |
| SuperMartijn642's Config Library | Config Lib makes dealing with config files just a bit easier. | SuperMartijn642 | All Rights Reserved | [Modrinth](https://modrinth.com/mod/supermartijn642s-config-lib) |
| SuperMartijn642's Core Lib | SuperMartijn642's Core Lib adds lots of basic implementations for guis that allow for similar code between Minec… | SuperMartijn642 | All Rights Reserved | [Modrinth](https://modrinth.com/mod/supermartijn642s-core-lib) |
| Supplementaries | Many functional and useful Vanilla+ blocks | MehVahdJukaar, Plantkillable | Custom — Supplementaries Team License [^1] | [Modrinth](https://modrinth.com/mod/supplementaries) |
| Supplementaries Squared | Additional blocks for Supplementaries | MehVahdJukaar, Plantkillable | Custom — Supplementaries Team License [^1] | [Modrinth](https://modrinth.com/mod/supplementaries-squared) |
| Surveyor Map Framework | Unified API, networking, and save data for map mods. | Sisby folk. Contributions by Ampflower, falkreon, jaskarth, Garden System | LGPL-3.0-or-later | [Modrinth](https://modrinth.com/mod/surveyor) |
| Surveystones | Adds surveyor landmarks for discovered waystones | Sisby folk. Contributions by lack | LGPL-3.0-only | [Modrinth](https://modrinth.com/mod/surveystones) |
| TCIntegrations | Tinkers' Construct Mod Integraions and Tweaks. | wendall911 | MIT | [Modrinth](https://modrinth.com/mod/tcintegrations) |
| TerraBlender | A library mod for adding biomes in a simple and compatible manner with Minecraft's new biome/terrain system. | Adubbz | LGPL-3.0-only | [CurseForge](https://www.curseforge.com/minecraft/mc-mods/terrablender) |
| ThreatenGL | Threatens Minecraft to use a different version of OpenGL. | Richy Z. | LGPL-3.0-only | [Modrinth](https://modrinth.com/mod/threatengl) |
| Tinkers' Construct | A little of this, a little of that, a lot of tinkering, and a lot of tools | Slime Knights | MIT | [Modrinth](https://modrinth.com/mod/tinkers-construct) |
| Tinkers' Delight | Tinkers' Construct & Farmer's Delight compat. | NoCube | All Rights Reserved | [Modrinth](https://modrinth.com/mod/tinkers-construct-delight) |
| Tinkers' Things | A fully playable example Thing Pack for Tinkers' Construct. Includes example tools, weapon, and material. | KnightMiner | MIT [^14] | [Modrinth](https://modrinth.com/mod/tinkers-things) |
| Toast Control | Blocking annoying popups since 1.12 | Shadows_of_Fire | MIT | [CurseForge](https://www.curseforge.com/minecraft/mc-mods/toast-control) |
| Tom's Simple Storage Mod | Simple vanilla style storage mod. | tom5454 | MIT | [Modrinth](https://modrinth.com/mod/toms-storage) |
| TooManyRecipeViewers | A compatibility layer for running JEI plugins with EMI written by Nolij | Nolij (@xdMatthewbx#1337) & the Craftoria team | OSL-3.0 | [Modrinth](https://modrinth.com/mod/tmrv) |
| Trading Post | Rule the village! Trade with every villager at once! | Fuzs | MPL-2.0 | [Modrinth](https://modrinth.com/mod/trading-post) |
| Trash Cans | Trash Cans adds Trash Cans which can be used to void items, liquids and energy! | SuperMartijn642 | All Rights Reserved | [Modrinth](https://modrinth.com/mod/trash-cans) |
| Universal Sawmill | Simple, Elegant, Universal Sawmill | MehVahdJukaar | Custom — Supplementaries Team License [^1] | [Modrinth](https://modrinth.com/mod/universal-sawmill) |
| Villagers Sell Animals | Makes villagers sell different farm animals. | NoCube | All Rights Reserved | [CurseForge](https://www.curseforge.com/minecraft/mc-mods/villagers-sell-animals) |
| VillagersPlus | New villagers, new trades and new beautiful and useful workstations. | Lion | GPL-3.0 [^15] | [Modrinth](https://modrinth.com/mod/villagersplus) |
| Waystones | Teleport back to activated waystones. For Survival, Adventure or Servers. | BlayTheNinth | All Rights Reserved | [CurseForge](https://www.curseforge.com/minecraft/mc-mods/waystones) |
| YUNG's API | API Library for YUNG's minecraft mods. | YUNGNICKYOUNG | LGPL-3.0-only | [Modrinth](https://modrinth.com/mod/yungs-api) |
| Zeta | A fully featured Library designed around loading highly configurable, agile developed. modular mods | Vazkii, quat, IThundxr, siuol, wiresegal, MehVahdJukaar | CC-BY-NC-SA-3.0 | [Modrinth](https://modrinth.com/mod/zeta) |

Notes on specific licenses:

[^1]: Source-available with redistribution restrictions; see the project page.
[^2]: Split license: code MIT, art assets All Rights Reserved (Starfish Studios). The jar's 'MIT' only covers the code.
[^3]: The source LICENSE file is GPL-3.0 and the jar agrees; the Modrinth listing's 'All Rights Reserved' is stale.
[^4]: The source LICENSE file is GPL-3.0 (not LGPL as the Modrinth listing shows).
[^5]: No Forge mods.toml in the jar (loader shim), so its modId reads blank; keyed by Modrinth project id u58R1TMW. License from the source repo.
[^6]: Source-available: code is MIT, art/assets are All Rights Reserved. The jar's bare 'MIT' only covers the code.
[^7]: The source LICENSE file is LGPL-3.0; the jar mislabels it MIT.
[^8]: Custom source-available license; the jar stores the license as a bare URL.
[^9]: The source LICENSE file is CC0-1.0; the jar metadata is a placeholder ('Insert License Here').
[^10]: Author from the source repo; the jar lists the author as the placeholder 'Me!'.
[^11]: The source LICENSE file states All Rights Reserved; the Modrinth listing mislabels it MIT.
[^12]: The source LICENSE file is MIT; the jar metadata mislabels it All Rights Reserved.
[^13]: From the source LICENSE; the jar metadata is a placeholder ('Insert License Here').
[^14]: Author from the project page; the jar leaves the authors field blank.
[^15]: The source LICENSE file is GPL-3.0; the jar metadata mislabels it CC0.

A dash in the License column means no license could be confirmed from the jar, the project's listing, or its source repository. Treat those as All Rights Reserved unless and until the author states otherwise.
<!-- END:MODS -->

---

## Resource packs

<!-- BEGIN:RESOURCEPACKS -->
Novus ships a curated texture and animation stack, applied automatically through Paxi, plus two opt-in packs you can turn on yourself. They come in three groups: third-party packs included whole, Novus packs that merge or adapt third-party work, and the original Novus3D_* / Novus_* packs built for this pack. The original packs pull models and textures directly from the upstream "source packs" listed further down, so those upstream licenses still govern the bundled assets.

> **Please read — resource-pack licensing.** Unlike the mods, which are distributed as download links plus file hashes, the resource packs are shipped as actual files. Several of the source packs below are All Rights Reserved, and a few say outright "no redistribution without permission." Bundling their assets in a publicly distributed pack goes beyond what those licenses grant. For a private group this is low-risk. Before any public release, get permission, switch to permissively-licensed sources, or leave those packs out of the public build. The credits below are given in good faith and to honor attribution-required licenses.

### Third-party packs, included whole

| Pack(s) | Author | License / terms | Link |
|---|---|---|---|
| Authentic Shadows (shipped as `Authentic Shadows_1.20.zip`) | Liahim85 | All Rights Reserved — Bundled with credit; get permission before any public release. | https://modrinth.com/resourcepack/authentic-shadows |
| Fresh Animations (shipped as `FreshAnimations_v1.10.4_Novus`) | Fresh_LX | Custom — Terms of use in the project description: modpack inclusion allowed with credit; no redistribution of the standalone pack. | https://modrinth.com/resourcepack/fresh-animations |
| FA Extensions — Emissive, Player, Quivers, Spiders | Fresh_LX | All Rights Reserved — Same Fresh Animations terms. | https://modrinth.com/resourcepack/fresh-animations-extensions |
| Vanilla Tweaks packs (3D Amethyst/Dripstone/Redstone Dust, Age-25 Kelp, Compass Lodestone, Disc Redstone, Groovy Levers, Visual Noteblock) | Vanilla Tweaks team | Custom — Include only if modified, credited, and kept free; no verbatim re-hosting. | https://vanillatweaks.net |
| Randomized Textures (opt-in, in `resourcepacks/`) | Vanilla Tweaks team | Custom — Same Vanilla Tweaks terms. | https://vanillatweaks.net |
| Quark Programmer Art (opt-in, in `resourcepacks/`) | Vazkii / Quark Team | CC-BY-NC-SA-3.0 | https://github.com/VazkiiMods/Quark |

### Novus packs that merge or adapt third-party work

| Pack | Built from | Upstream authors |
|---|---|---|
| `FA+AL+Azu_Zombies` | AL's Zombies Revamped + FA and Azu's Enhanced Zombie Variants FA, merged for 1.20.1 | Fresh_LX · AZUHCK |
| `FA+Witch_Old` | Vanilla witch CEM extracted from the Fresh Animations base | Fresh_LX (base) · assembled by z0nb1 |
| `PA-FA-Compat` | FA: Player Extension × PlayerAnimator compatibility patch | AxoLabs · MPL-2.0 |
| `Novus3D_Corundum`, `Novus3D_SlimeCrystal` | Stridey's Vanilla Tweaks 3D Amethyst crystal template, recolored | Stridey / Vanilla Tweaks |

### Original packs made for Novus

By z0nb1 (b1ll3b0b). Each one assembles or adapts assets from the source packs below rather than drawing new art, so the upstream licenses apply to those assets.

| Pack | Draws assets from |
|---|---|
| `Novus3D_Objects` | Actually 3D (3D torch geometry applied to the Infinity Buttons mod's lever/button blocks) |
| `Novus3D_Plants` | Vanilla Tweaks · Actually 3D · Allure 3D Plants · Tinkers' Construct 3D |
| `Novus3D_Stations` | Actually 3D (crafting) · Heycronus Furnaces 3D + Craft 3D + Barrel 3D (cooking/storage) |
| `Novus3D_Ladders` | RAY's 3D Ladders · Vanilla Tweaks · Ladder 3D Pack (mega_trainer) |
| `Novus3D_Rails` | Actually 3D · RAY's 3D Rails · Modded Rail 3D Pack (mega_trainer) |
| `Novus3D_Brewing` | Actually 3D (+ Amendments tint patch) |
| `Novus3D_Doors` | Actually 3D · Supplementaries 3D Doors & Trapdoors |
| `Novus3D_Crops` | crops-3d (base) · Actually 3D · REVIVED Farmer's Delight Crops 3D |
| `Novus_Glass` | Fusion Connected Glass (base) · Better Stained Glass (panes) |
| `Novus_BotaniaImprovedFlowers`, `Novus_DiscRedstone_*` | Novus-original / Vanilla Tweaks-style |

### Source packs (assets drawn from)

Licenses confirmed from each project's listing or in-file LICENSE on 2026-06-05. A blank License cell means none was stated anywhere — treat it as All Rights Reserved until confirmed.

| Source pack | Author | License | Link |
|---|---|---|---|
| Actually 3D — Blocks & Items r1.8 | Matt_Crowberry | CC-BY-4.0 | https://modrinth.com/resourcepack/actually-3d-blocks-and-items |
| Actually 3D — Flowers & Plants | Chomik_Oto | CC-BY-4.0 | https://modrinth.com/resourcepack/actually-3d-plants |
| RAY's 3D Ladders / 3D Rails | xR4YM0ND | MIT — LICENSE confirmed inside the pack file. | https://github.com/xR4YM0ND |
| Vanilla Tweaks (incl. Stridey's 3D Amethyst) | Vanilla Tweaks team | Custom — Modify + credit + keep free. | https://vanillatweaks.net |
| Heycronus 3D packs — Craft 3D, Barrel 3D, Furnaces 3D, Better 3D Beds | Heycronus | All Rights Reserved — Furnaces 3D replaced the previous Undopia furnaces source. | https://www.curseforge.com/members/heycronus/projects |
| Allure 3D Plants | P4ncake | All Rights Reserved | https://modrinth.com/resourcepack/allure-3d-plants |
| AA4 Structure Markers | x7bbbbbbb | CC-BY-NC-SA-4.0 | https://modrinth.com/resourcepack/aa4-structure-markers |
| Fusion Connected Glass | SuperMartijn642 | All Rights Reserved — Requires the Fusion mod. | https://modrinth.com/resourcepack/fusion-connected-glass |
| Better Stained Glass | elwood612 | — (No license stated on the listing; treat as All Rights Reserved until confirmed.) | https://www.curseforge.com/minecraft/texture-packs/better-stained-glass |
| Ladder 3D · Modded Rail 3D | mega_trainer | All Rights Reserved — Listing states "do not repost" — personal use only, no redistribution. | https://www.curseforge.com/members/mega_trainer/projects |
| Supplementaries 3D Doors & Trapdoors | thricebite | CC-BY-NC-SA-4.0 | https://modrinth.com/resourcepack/supplementaries-3d-doors-and-trapdoors |
| REVIVED Farmer's Delight Crops 3D | YStheStudio | GPL-3.0-only | https://modrinth.com/resourcepack/revived-farmers-delight-crops-3d |
| crops-3d (base of Novus3D_Crops) | NinthWorld | — (No license stated on the listing; confirm before public release.) | https://www.curseforge.com/minecraft/texture-packs/crops-3d |
| Tinkers' Construct (referenced textures) | Slime Knights | MIT — The mod itself. | https://github.com/SlimeKnights/TinkersConstruct |

### Datapacks

Datapacks bundled in the pack — either applied automatically through Paxi (config/paxi/datapacks/) or merged into the KubeJS data layer (kubejs/data/). Each stays under its author's license.

| Datapack | Author | License | Applied via | Link |
|---|---|---|---|---|
| Repurposed Structures — Chef's Delight, Farmer's Delight & VillagersPlus compat | telepathicgrunt (the Farmer's Delight variant credits pm095) | LGPL-3.0 | Paxi | https://modrinth.com/datapack/repurposed-structures |
| Respite: There's Ash in My Coffee!! — wild coffee & tea bush worldgen, kettle loot | Myriadh | MIT | merged into kubejs/data/farmersrespite | https://modrinth.com/datapack/ash-in-my-coffee |
<!-- END:RESOURCEPACKS -->

---

## The pack's own work & license

The parts of Novus that are original — its configuration, KubeJS scripts,
recipe and data overrides, the build tooling in this repo, and the original
`Novus3D_*` / `Novus_*` resource packs — are the work of **z0nb1** (b1ll3b0b).
The original resource packs are assembled by z0nb1 but contain third-party
assets that stay under their upstream licenses.

That original work is licensed **[CC BY-NC-SA 4.0](LICENSE)** — attribution,
non-commercial, share-alike. Third-party mods and resource-pack assets are **not**
covered by it and remain under their own licenses, listed above. Where an
upstream license is more restrictive, it wins.

---

## Credits

Novus is a curation of other people's work. Thank you to every mod and
resource-pack author listed above — and especially to the people whose mods
recur throughout the pack or anchor whole systems:

**Anchor & recurring mod authors**

- **Vazkii** — Botania, Quark, Quark Oddities, Patchouli, Zeta
- **simibubi & the Create team** — Create, the backbone of the whole pack, plus much of the Create addon ecosystem
- **MehVahdJukaar & Plantkillable** — Supplementaries, Supplementaries Squared, Amendments, Moonlight Library, Every Compat, Map Atlases, JEED
- **Sketch & Peachy Macaw** — the entire Macaw's decoration suite (Doors, Roofs, Windows, Stairs, Bridges, Fences & Walls, Paths, Trapdoors, Lights & Lamps, Holidays)
- **Fuzs & XFactHD** — Puzzles Lib, the Diagonal Fences/Walls/Windows family, Bartering Station, Leaves Be Gone, Plenty Plates, Trading Post
- **MrCrayfish** — Configured, Catalogue, Controllable, Framework, Backpacked, Goblin Traders
- **SuperMartijn642** — the core & config libraries, Fusion, Trash Cans, Scarecrows' Territory
- **KnightMiner & the Slime Knights** — Tinkers' Construct, Mantle, Tinkers' Things, Ceramics
- **LatvianModder** — KubeJS, KubeJS Create, Rhino
- **Ferreusveritas, Max Hyper & Harley O'Connor** — Dynamic Trees and its Plus, Quark, and Tinkers' add-ons
- **Elenterius** — Biomancy, Create: Bio-Factory
- **vectorwing** — Farmer's Delight
- **Jaredlll08 (BlameJared)** — CraftTweaker, Controlling, Searchables, Initial Inventory
- **NoCube** — Create Recycle Everything, Quark Delight, Tinkers' Construct Delight, Villagers Sell Animals
- **Adubbz** — Serene Seasons, TerraBlender, GlitchCore
- **ThatGravyBoat & Alex Nijjar** — Argonauts, Cadmus, Resourceful Lib, Resourceful Config
- **Sisby folk** — Antique Atlas, Surveyor, Surveystones
- **YUNGNICKYOUNG** — YUNG's API and **Paxi**, the resource/datapack loader the whole pack stack runs on
- **embeddedt** — Embeddium, ModernFix (performance)
- **Traben** — Entity Model Features, Entity Texture Features
- **Darkhax** — Bookshelf, Enchantment Descriptions
- **Illusive Soulworks** — Cherished Worlds, Comforts, Polymorph
- **mortuusars** — Chalk, Exposure, Exposure Polaroid
- **shedaniel** — Architectury API, Cloth Config
- **BlayTheNinth** — Balm, Waystones, Default Options
- **Shadows_of_Fire** — Placebo, Toast Control
- **nonamecrackers2** — Simple Clouds
- **Max Henkel** — Simple Voice Chat (also a Sound Physics Remastered author)
- **thedarkcolour** — Kotlin for Forge  ·  **the Sinytra team** — Connector

**Texture / animation backbone**

- **Fresh_LX** (Fresh Animations), the **Vanilla Tweaks** team, **Matt_Crowberry** and **Chomik_Oto** (Actually 3D), **Heycronus** (the 3D block packs), and **Stridey**

If your work is here and it's miscredited or missing, please open an issue — the
full per-item attribution is in the tables above.
