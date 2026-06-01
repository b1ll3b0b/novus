# Novus

**A Create-anchored progression modpack for Minecraft 1.20.1 (Forge).**

Novus grafts Tinkers' Construct material progression onto Create's automation
chassis, layers Farmer's Delight food complexity and Quark / Supplementaries /
Macaw's decoration on top, and splits magic into two distinct paths — Botania
(flora magic, tied to the agriculture stack) and Biomancy (flesh magic, bridged
into Create). It is deliberately *not* a kitchen-sink pack: there's no combat
overhaul, no quest layer, and no tech endgame beyond Create. The pack is
bridge-heavy by design — a large set of compatibility mods make these ecosystems
interoperate.

`Minecraft 1.20.1` · `Forge 47.4.20` · `Java 17` · **190 mods**

---

## Install

- **Self-updating (recommended):** import `Novus.zip` into Prism / MultiMC
  (Add Instance → Import from zip). A pre-launch hook keeps it up to date on every
  launch from the project's page.
- **Standalone download:** grab `novus-<version>-complete.zip` (client /
  singleplayer) or `novus-<version>-server.zip` (dedicated server) from the
  [Releases](https://github.com/b1ll3b0b/novus/releases).
- **packwiz:** point a packwiz-installer at the published `pack.toml`.

---

## Licensing & credits — read this

Everything below belongs to its respective author and is included under its own
license. A few principles this pack follows:

- **Mods are distributed as metadata** (download URL + file hash), **not** re-hosted
  jars. Installing Novus pulls each mod from its official Modrinth/CurseForge source,
  so the pack itself redistributes nothing for the ~187 metadata-tracked mods.
- **Resource packs** are credited below. Where a pack's terms permit modpack
  inclusion (Fresh Animations, Actually 3D, Vanilla Tweaks all do, with credit),
  that's the basis for including it; the credit requirement is met here.
- A handful of CurseForge mods can't be fetched by automated installers, so their
  jars are bundled directly — see the note under the mod table.

**License mix across the 190 mods:**

| Category | Count |
|---|---|
| Open source (MIT, Apache, LGPL/GPL, MPL, OSL, etc.) | 131 |
| All rights reserved | 43 |
| Custom / source-available (Create, Supplementaries, Botania, etc.) | 9 |
| Creative Commons non-commercial (Quark family, Jade, compasses) | 7 |

Novus started with an all-open-source goal; in practice it drifted to roughly
two-thirds OSI-open. The non-open remainder is mostly popular "all rights reserved"
content (Waystones, the Macaw's suite, SuperMartijn642's libraries, Serene Seasons)
and source-available-but-not-OSI licenses (Create, Supplementaries/Amendments,
Botania). This is normal for a Forge pack and is disclosed here in full.

> Not legal advice. Licenses were read from each project's Modrinth license field
> and/or the mod's own `mods.toml`; if you spot an error, please open an issue.

---

## Mods (190)

| Mod | Author | License | Source |
|---|---|---|---|
| AgriCraft | InfinityRaider, Ketheroth | MIT | [Modrinth](https://modrinth.com/mod/agricraft) |
| Amendments | MehVahdJukaar | LicenseRef-Supplementaries-Team-License-1.1 | [Modrinth](https://modrinth.com/mod/amendments) |
| Another Furniture | Starfish Studios | LicenseRef-Custom | [Modrinth](https://modrinth.com/mod/another-furniture) |
| Antique Atlas 4 | Hunternif, tyra314, Sisby folk | LGPL-3.0-or-later | [Modrinth](https://modrinth.com/mod/antique-atlas-4) |
| AppleSkin | squeek | Unlicense | [Modrinth](https://modrinth.com/mod/appleskin) |
| Architectury API | shedaniel | LGPL-3.0-only | [Modrinth](https://modrinth.com/mod/architectury-api) |
| Auroras | Verph | BSD-2-Clause | [Modrinth](https://modrinth.com/mod/auroras) |
| Backpacked | MrCrayfish | GNU Lesser General Public License v2.1 | [CurseForge](https://www.curseforge.com/minecraft/mc-mods/backpacked) |
| Balm | BlayTheNinth | ARR | [CurseForge](https://www.curseforge.com/minecraft/mc-mods/balm) |
| Bartering Station | Fuzs | MPL-2.0 | [Modrinth](https://modrinth.com/mod/bartering-station) |
| Better Combat | Daedelus | LicenseRef-All-Rights-Reserved | [Modrinth](https://modrinth.com/mod/better-combat) |
| Better Days | wendall911 | LGPL-3.0-or-later | [Modrinth](https://modrinth.com/mod/betterdays) |
| Better Third Person | Socolio | LicenseRef-All-Rights-Reserved | [Modrinth](https://modrinth.com/mod/better-third-person) |
| Biomancy | Elenterius, RhinoW | MIT | [Modrinth](https://modrinth.com/mod/biomancy) |
| Biomantic Delight | thesh, MCreator | LicenseRef-All-Rights-Reserved | [Modrinth](https://modrinth.com/mod/bio-delight) |
| Bookshelf | Darkhax | LGPL-2.1-only | [Modrinth](https://modrinth.com/mod/bookshelf-lib) |
| Botania | Vazkii, wiiv, williewillus, dylan4ever, Hubry, Alwinfy, artemisSystem, Falkory220 | LicenseRef-Botania-License | [Modrinth](https://modrinth.com/mod/botania) |
| Bountiful | Ejektaflex | LGPL-3.0-only | [Modrinth](https://modrinth.com/mod/bountiful) |
| brewin-and-chewin | Probleyes, Umpaz, MerchantPug | MIT | [Modrinth](https://modrinth.com/mod/brewin-and-chewin) |
| Canary | AbdElAziz | LGPL-3.0-only | [Modrinth](https://modrinth.com/mod/canary) |
| Catalogue | MrCrayfish | MIT | [CurseForge](https://www.curseforge.com/minecraft/mc-mods/catalogue) |
| Ceramics | KnightMiner | MIT | [Modrinth](https://modrinth.com/mod/ceramics) |
| Chalk | mortuusars | MIT | [Modrinth](https://modrinth.com/mod/chalk-mod) |
| chefs-delight | Redstone Games | MIT | [Modrinth](https://modrinth.com/mod/chefs-delight) |
| Cherished Worlds | Illusive Soulworks | LGPL-3.0-or-later | [Modrinth](https://modrinth.com/mod/cherished-worlds) |
| Chunky | pop4959 | GPL-3.0-only | [Modrinth](https://modrinth.com/mod/chunky) |
| Clockwork | — | Apache-2.0 | [Modrinth](https://modrinth.com/mod/create-clockwork) |
| Cloth Config API | shedaniel | LGPL-3.0-only | [Modrinth](https://modrinth.com/mod/cloth-config) |
| Collective | Rick South | LicenseRef-All-Rights-Reserved | [Modrinth](https://modrinth.com/mod/collective) |
| Comforts | Illusive Soulworks | LGPL-3.0-or-later | [Modrinth](https://modrinth.com/mod/comforts) |
| Compat Delight | FixerLink | LicenseRef-All-Rights-Reserved | [Modrinth](https://modrinth.com/mod/compat-delight) |
| Configured | MrCrayfish | GNU Lesser General Public License v3.0 | [CurseForge](https://www.curseforge.com/minecraft/mc-mods/configured) |
| Controllable | MrCrayfish | MIT | [CurseForge](https://www.curseforge.com/minecraft/mc-mods/controllable) |
| Controlling | Jaredlll08 | MIT | [Modrinth](https://modrinth.com/mod/controlling) |
| CraftTweaker | Jaredlll08, Kindlich, StanHebben and TheSilkMiner | MIT | [Modrinth](https://modrinth.com/mod/crafttweaker) |
| Create | simibubi | LicenseRef-Create-Mod-License | [Modrinth](https://modrinth.com/mod/create) |
| Create Contraption Terminals | tom5454 | MIT | [Modrinth](https://modrinth.com/mod/create-contraption-terminals) |
| Create Crafts & Additions | MRH0 | MIT | [Modrinth](https://modrinth.com/mod/createaddition) |
| Create Deco | Kayla, Talrey, Ordana, Cassian | MIT | [Modrinth](https://modrinth.com/mod/create-deco) |
| Create Jetpack | possible_triangle | LicenseRef-Custom | [Modrinth](https://modrinth.com/mod/create-jetpack) |
| Create Recycle Everything | NoCube | ARR | [CurseForge](https://www.curseforge.com/minecraft/mc-mods/create-recycle-everything) |
| create-steam-n-rails | The Railways Team | LGPL-3.0-only | [Modrinth](https://modrinth.com/mod/create-steam-n-rails) |
| Create: Armory | dcchill | LicenseRef-All-Rights-Reserved | [Modrinth](https://modrinth.com/mod/create-armory) |
| Create: Bells & Whistles | lev | GPL-3.0-or-later | [Modrinth](https://modrinth.com/mod/bellsandwhistles) |
| Create: Bio-Factory | Elenterius | MIT | [Modrinth](https://modrinth.com/mod/biofactory) |
| Create: Blaze Burner Fuels | robinfrt | LicenseRef-All-Rights-Reserved | [Modrinth](https://modrinth.com/mod/create-blaze-burner-fuels) |
| Create: Central Kitchen | LimonBlaze, MarbleGate and Etherwood | LGPL-3.0-or-later | [Modrinth](https://modrinth.com/mod/create-central-kitchen) |
| Create: Connected | Lysine | AGPL-3.0-or-later | [Modrinth](https://modrinth.com/mod/create-connected) |
| Create: Copycats+ | Lysine, Bennyboy1695, Redcat_XVIII | LicenseRef-All-Rights-Reserved | [Modrinth](https://modrinth.com/mod/copycats) |
| Create: Diesel Generators | George VI | MIT | [Modrinth](https://modrinth.com/mod/create-diesel-generators) |
| Create: Enchantment Industry | MarbleGateKeeper & LimonBlaze | LGPL-3.0-or-later | [Modrinth](https://modrinth.com/mod/create-enchantment-industry) |
| Create: Escalated | rbasamoyai | MIT | [Modrinth](https://modrinth.com/mod/escalated) |
| Create: Hypertubes | Rok | Apache-2.0 | [Modrinth](https://modrinth.com/mod/hypertube) |
| Create: Power Loader | Lysine | MIT | [Modrinth](https://modrinth.com/mod/create-power-loader) |
| Create: Sound of Steam | FinchyMcFinch, Deanosaur75 | MIT | [Modrinth](https://modrinth.com/mod/create-sound-of-steam) |
| Create: Vibrant Vaults | ZLT | MIT | [Modrinth](https://modrinth.com/mod/create-vibrant-vaults) |
| Curios API | C4 | LGPL-3.0-or-later | [Modrinth](https://modrinth.com/mod/curios) |
| Diagonal Fences | Fuzs, XFactHD | MPL-2.0 | [Modrinth](https://modrinth.com/mod/diagonal-fences) |
| Diagonal Walls | Fuzs, XFactHD | MPL-2.0 | [Modrinth](https://modrinth.com/mod/diagonal-walls) |
| Diagonal Windows | Fuzs, XFactHD | MPL-2.0 | [Modrinth](https://modrinth.com/mod/diagonal-windows) |
| Dynamic Trees | Ferreusveritas | MIT | [Modrinth](https://modrinth.com/mod/dynamictrees) |
| Dynamic Trees - Quark | Max Hyper | MIT | [Modrinth](https://modrinth.com/mod/dynamic-trees-quark) |
| Dynamic Trees Plus | Ferreusveritas, Max Hyper/supermassimo, Harley O'Connor | MIT | [Modrinth](https://modrinth.com/mod/dynamictreesplus) |
| dynamic-trees-tinkers-construct | Max Hyper | MIT | [CurseForge](https://www.curseforge.com/minecraft/mc-mods/dynamic-trees-tinkers-construct) |
| Embeddium | embeddedt | LGPL-3.0-only | [Modrinth](https://modrinth.com/mod/embeddium) |
| EMI | Emi | MIT | [Modrinth](https://modrinth.com/mod/emi) |
| Enchantment Descriptions | Darkhax | LGPL-2.1-only | [Modrinth](https://modrinth.com/mod/enchantment-descriptions) |
| EnderChests | ShetiPhian; Artwork: Fruzstrated | LicenseRef-All-Rights-Reserved | [Modrinth](https://modrinth.com/mod/enderchests) |
| EnderTanks | ShetiPhian; Artwork: Fruzstrated | LicenseRef-All-Rights-Reserved | [Modrinth](https://modrinth.com/mod/endertanks) |
| Entity Model Features | Traben | LGPL-3.0-only | [Modrinth](https://modrinth.com/mod/entity-model-features) |
| Entity Texture Features | Traben | LGPL-3.0-only | [Modrinth](https://modrinth.com/mod/entitytexturefeatures) |
| EntityCulling | tr7zw | LicenseRef-tr7zw-Protective-License | [Modrinth](https://modrinth.com/mod/entityculling) |
| Every Compat | MehVahdJukaar | LicenseRef-All-Rights-Reserved | [Modrinth](https://modrinth.com/mod/every-compat) |
| explorers-compass | ChaosTheDude | CC-BY-NC-SA-4.0 | [Modrinth](https://modrinth.com/mod/explorers-compass) |
| Exposure | mortuusars | MIT | [Modrinth](https://modrinth.com/mod/exposure) |
| Exposure Polaroid | mortuusars | MIT | [Modrinth](https://modrinth.com/mod/exposure-polaroid) |
| FA: Player Extension Compat | ArimoV2 | MPL-2.0 | [Modrinth](https://modrinth.com/mod/fa-player-extension-compat) |
| farmers-delight | vectorwing | MIT | [Modrinth](https://modrinth.com/mod/farmers-delight) |
| farmers-delight-plus | Johnyele | MIT | [Modrinth](https://modrinth.com/mod/farmers-delight-plus) |
| farmers-respite | Umpaz, Probleyes | MIT | [CurseForge](https://www.curseforge.com/minecraft/mc-mods/farmers-respite) |
| FerriteCore | malte0811 | MIT | [Modrinth](https://modrinth.com/mod/ferrite-core) |
| Forgified Fabric API | FabricMC, Sinytra | Apache-2.0 | [Modrinth](https://modrinth.com/mod/forgified-fabric-api) |
| Framework | MrCrayfish | LGPL-3.0 | [CurseForge](https://www.curseforge.com/minecraft/mc-mods/framework) |
| Freecam | hashalite | MIT | [Modrinth](https://modrinth.com/mod/freecam) |
| frights-delight | ChefMooon | MIT | [Modrinth](https://modrinth.com/mod/frights-delight) |
| Fusion (Connected Textures) | SuperMartijn642 | LicenseRef-All-Rights-Reserved | [Modrinth](https://modrinth.com/mod/fusion-connected-textures) |
| Fzzy Config | fzzyhmstrs | LicenseRef-TDL-M | [Modrinth](https://modrinth.com/mod/fzzy-config) |
| gabous-libs | Gabou | LicenseRef-All-Rights-Reserved | [Modrinth](https://modrinth.com/mod/gabous-libs) |
| Geckolib | Gecko, Eliot, AzureDoom, DerToaster, Tslat, Witixin | MIT | [Modrinth](https://modrinth.com/mod/geckolib) |
| GlitchCore | Adubbz | LicenseRef-All-Rights-Reserved | [Modrinth](https://modrinth.com/mod/glitchcore) |
| Goblin Traders | MrCrayfish | MIT | [CurseForge](https://www.curseforge.com/minecraft/mc-mods/goblin-traders) |
| Hide Experimental Warning | Rick South | LicenseRef-All-Rights-Reserved | [Modrinth](https://modrinth.com/mod/hide-experimental-warning) |
| Hyperbox | Commoble | MIT | [Modrinth](https://modrinth.com/mod/hyperbox) |
| ImmediatelyFast | RK_01 | LGPL-3.0-only | [Modrinth](https://modrinth.com/mod/immediatelyfast) |
| Immersive Gateways | Luke100000 | GPL-3.0-only | [Modrinth](https://modrinth.com/mod/immersive-gateways) |
| Infinity Buttons | LarsMans | MIT | [Modrinth](https://modrinth.com/mod/infinitybuttons) |
| Initial Inventory | Jaredlll08 | MIT | [CurseForge](https://www.curseforge.com/minecraft/mc-mods/initial-inventory) |
| Jade Addons (Neo/Forge) | Snownee | LicenseRef-All-Rights-Reserved | [Modrinth](https://modrinth.com/mod/jade-addons-forge) |
| Jade 🔍 | Snownee | CC-BY-NC-SA-4.0 | [Modrinth](https://modrinth.com/mod/jade) |
| Json Things | gigaherz | BSD | [CurseForge](https://www.curseforge.com/minecraft/mc-mods/json-things) |
| Just Enough Breeding | Christofmeg | MIT | [Modrinth](https://modrinth.com/mod/justenoughbreeding) |
| Just Enough Effect Descriptions (JEED) | MehVahdJukaar | LicenseRef-All-Rights-Reserved | [Modrinth](https://modrinth.com/mod/just-enough-effect-descriptions-jeed) |
| Just Enough Professions (JEP) | Mrbysco, ShyNieke | MIT | [Modrinth](https://modrinth.com/mod/just-enough-professions-jep) |
| Kambrik | Me! | MPL-2.0 | [Modrinth](https://modrinth.com/mod/kambrik) |
| Kotlin For Forge | — | LGPL-2.1-only | [Modrinth](https://modrinth.com/mod/kotlin-for-forge) |
| KubeJS | LatvianModder | LGPL-3.0-only | [Modrinth](https://modrinth.com/mod/kubejs) |
| KubeJS Additions | ILIKEPIEFOO2 | MIT | [Modrinth](https://modrinth.com/mod/kubejs-additions) |
| KubeJS Create | LatvianModder | LGPL-3.0-only | [Modrinth](https://modrinth.com/mod/kubejs-create) |
| KubeJS Delight | QinomeD, Bob Varioa | LGPL-3.0 | [CurseForge](https://www.curseforge.com/minecraft/mc-mods/kubejs-delight) |
| Leaves Be Gone | Fuzs | MPL-2.0 | [Modrinth](https://modrinth.com/mod/leaves-be-gone) |
| Lighty | andi_makes, agnor99 | Apache-2.0 | [Modrinth](https://modrinth.com/mod/lighty) |
| macaws-bridges | Sketch Macaw & Peachy Macaw | LicenseRef-All-Rights-Reserved | [Modrinth](https://modrinth.com/mod/macaws-bridges) |
| macaws-doors | Sketch Macaw & Sketch Peachy | MIT | [Modrinth](https://modrinth.com/mod/macaws-doors) |
| macaws-fences-and-walls | Sketch Macaw & Peachy Macaw | MIT | [Modrinth](https://modrinth.com/mod/macaws-fences-and-walls) |
| macaws-holidays | Sketch Macaw & Peachy Macaw | LicenseRef-All-Rights-Reserved | [Modrinth](https://modrinth.com/mod/macaws-holidays) |
| macaws-lights-and-lamps | Sketch Macaw & Peachy Macaw | LicenseRef-All-Rights-Reserved | [Modrinth](https://modrinth.com/mod/macaws-lights-and-lamps) |
| macaws-paths-and-pavings | Sketch Macaw & Peachy Macaw | MIT | [Modrinth](https://modrinth.com/mod/macaws-paths-and-pavings) |
| macaws-roofs | Sketch Macaw & Sketch Peachy | LicenseRef-All-Rights-Reserved | [Modrinth](https://modrinth.com/mod/macaws-roofs) |
| macaws-stairs | Sketch Macaw & Sketch Peachy | LicenseRef-All-Rights-Reserved | [Modrinth](https://modrinth.com/mod/macaws-stairs) |
| macaws-trapdoors | Sketch Macaw & Peachy Macaw | MIT | [Modrinth](https://modrinth.com/mod/macaws-trapdoors) |
| macaws-windows | Sketch Macaw & Peachy Macaw | LicenseRef-All-Rights-Reserved | [Modrinth](https://modrinth.com/mod/macaws-windows) |
| Mantle | Slime Knights | MIT | [Modrinth](https://modrinth.com/mod/mantle) |
| miners-delight | Sammy; | LicenseRef-All-Rights-Reserved | [Modrinth](https://modrinth.com/mod/miners-delight) |
| MmmMmmMmmmmm | MehVahdJukaar, Bonusboni, Plantkillable | CC0-1.0 | [Modrinth](https://modrinth.com/mod/mmmmmmmmmmmm) |
| ModernFix | embeddedt | LGPL-3.0-only | [Modrinth](https://modrinth.com/mod/modernfix) |
| Moonlight Library | MehVahdJukaar | LicenseRef-LGPL-with-additional-dependency-clause | [Modrinth](https://modrinth.com/mod/moonlight) |
| More Create Burners | Dragon Egg | LicenseRef-All-Rights-Reserved | [Modrinth](https://modrinth.com/mod/more-create-burners) |
| More Red | Commoble | MIT | [Modrinth](https://modrinth.com/mod/more-red) |
| Mouse Tweaks | Ivan Molodetskikh (YaLTeR) | BSD-3-Clause | [Modrinth](https://modrinth.com/mod/mouse-tweaks) |
| natures-compass | ChaosTheDude | CC-BY-NC-SA-4.0 | [Modrinth](https://modrinth.com/mod/natures-compass) |
| Oculus | NanoLive, dima_dencep, coderbot, IMS212, Justsnoopy30, FoundationGames | LGPL-3.0-only | [Modrinth](https://modrinth.com/mod/oculus) |
| Particle Rain | pigcart | MIT | [Modrinth](https://modrinth.com/mod/particle-rain) |
| Patchouli | Vazkii | CC-BY-NC-SA-3.0 | [Modrinth](https://modrinth.com/mod/patchouli) |
| Paxi | YUNGNICKYOUNG | LGPL-3.0-only | [Modrinth](https://modrinth.com/mod/paxi) |
| Pehkui | Virtuoel | MIT | [Modrinth](https://modrinth.com/mod/pehkui) |
| petrolpark | petrolpark | LicenseRef-All-Rights-Reserved | [Modrinth](https://modrinth.com/mod/petrolpark) |
| petrols-parts | petrolpark | LicenseRef-All-Rights-Reserved | [Modrinth](https://modrinth.com/mod/petrols-parts) |
| Placebo | Shadows_of_Fire | MIT | [CurseForge](https://www.curseforge.com/minecraft/mc-mods/placebo) |
| playerAnimator | KosmX | MIT | [Modrinth](https://modrinth.com/mod/playeranimator) |
| Plenty Plates | Fuzs | MPL-2.0 | [Modrinth](https://modrinth.com/mod/plenty-plates) |
| PolyLib | CreeperHost | BSD-4-Clause | [Modrinth](https://modrinth.com/mod/polylib) |
| Polymorph | Illusive Soulworks | LGPL-3.0-or-later | [Modrinth](https://modrinth.com/mod/polymorph) |
| Ponder for KubeJS | kotakotik22, AlmostReliable | MIT | [Modrinth](https://modrinth.com/mod/ponder) |
| Powah! | owmii,Technici4n | LGPL-3.0-only | [Modrinth](https://modrinth.com/mod/powah) |
| Puzzles Lib | Fuzs | MPL-2.0 | [Modrinth](https://modrinth.com/mod/puzzles-lib) |
| Quark | Vazkii, WireSegal, MCVinnyq, Sully | CC-BY-NC-SA-3.0 | [Modrinth](https://modrinth.com/mod/quark) |
| Quark Delight | NoCube | ARR | [CurseForge](https://www.curseforge.com/minecraft/mc-mods/quark-delight) |
| Quark Oddities | Vazkii, WireSegal, MCVinnyq, Sully | CC-BY-NC-SA-3.0 | [Modrinth](https://modrinth.com/mod/quark-oddities) |
| Rainbows | Verph | BSD-2-Clause | [Modrinth](https://modrinth.com/mod/rainboows) |
| Repurposed Structures | TelepathicGrunt | LGPL-3.0-only | [Modrinth](https://modrinth.com/mod/repurposed-structures-forge) |
| Resourceful Config | — | MIT | [Modrinth](https://modrinth.com/mod/resourceful-config) |
| Rhino | latvian.dev, Mozilla | MPL-2.0 | [Modrinth](https://modrinth.com/mod/rhino) |
| Saturn | AbdElAziz | LGPL-3.0-only | [Modrinth](https://modrinth.com/mod/saturn) |
| Sawmill | MehVahdJukaar | LicenseRef-All-Rights-Reserved | [Modrinth](https://modrinth.com/mod/universal-sawmill) |
| scarecrows-territory | SuperMartijn642 | LicenseRef-All-Rights-Reserved | [Modrinth](https://modrinth.com/mod/scarecrows-territory) |
| Searchables | Jaredlll08 | MIT | [Modrinth](https://modrinth.com/mod/searchables) |
| Serene Seasons | Adubbz, Forstride | LicenseRef-All-Rights-Reserved | [Modrinth](https://modrinth.com/mod/serene-seasons) |
| Serene Seasons Plus | Gabou | LicenseRef-All-Rights-Reserved | [Modrinth](https://modrinth.com/mod/serene-seasons-plus) |
| ShetiPhianCore | ShetiPhian, Artwork: Fruzstrated | LicenseRef-All-Rights-Reserved | [Modrinth](https://modrinth.com/mod/shetiphiancore) |
| Simple Clouds | nonamecrackers2 | LicenseRef-PolyForm-Perimeter-License-1.0.1 | [Modrinth](https://modrinth.com/mod/simple-clouds) |
| Sinytra Connector | — | MIT | [Modrinth](https://modrinth.com/mod/connector) |
| Sodium Dynamic Lights | toni, LambdAurora | MIT | [Modrinth](https://modrinth.com/mod/sodium-dynamic-lights) |
| Sodium Options API | toni | LGPL-3.0-only | [Modrinth](https://modrinth.com/mod/sodium-options-api) |
| Sound Physics Remastered | Sonic Ether, vlad2305m, Max Henkel, Saint | GPL-3.0-only | [Modrinth](https://modrinth.com/mod/sound-physics-remastered) |
| Spice of Life: Classic Edition [1.20.1] | leopoko | MIT | [Modrinth](https://modrinth.com/mod/foodvariations) |
| Storage Drawers | Texelsaur | MIT | [Modrinth](https://modrinth.com/mod/storagedrawers) |
| Subtle Effects | MincraftEinstein | LicenseRef-All-Rights-Reserved | [Modrinth](https://modrinth.com/mod/subtle-effects) |
| supermartijn642s-config-lib | SuperMartijn642 | LicenseRef-All-Rights-Reserved | [Modrinth](https://modrinth.com/mod/supermartijn642s-config-lib) |
| supermartijn642s-core-lib | SuperMartijn642 | LicenseRef-All-Rights-Reserved | [Modrinth](https://modrinth.com/mod/supermartijn642s-core-lib) |
| Supplementaries | MehVahdJukaar, Plantkillable | LicenseRef-Supplementaries-Team-License | [Modrinth](https://modrinth.com/mod/supplementaries) |
| Supplementaries Squared | MehVahdJukaar, Plantkillable | LicenseRef-All-Rights-Reserved | [Modrinth](https://modrinth.com/mod/supplementaries-squared) |
| Surveyor Map Framework | Sisby folk | LGPL-3.0-or-later | [Modrinth](https://modrinth.com/mod/surveyor) |
| Surveystones | Sisby folk | LGPL-3.0-only | [Modrinth](https://modrinth.com/mod/surveystones) |
| tcintegrations | wendall911 | MIT | [Modrinth](https://modrinth.com/mod/tcintegrations) |
| TerraBlender (Forge) | Adubbz | LGPL-3.0 | [CurseForge](https://www.curseforge.com/minecraft/mc-mods/terrablender) |
| Tinkers Construct Delight | NoCube | LicenseRef-All-Rights-Reserved | [Modrinth](https://modrinth.com/mod/tinkers-construct-delight) |
| tinkers-construct | Slime Knights | MIT | [Modrinth](https://modrinth.com/mod/tinkers-construct) |
| tinkers-things | — | MIT | [Modrinth](https://modrinth.com/mod/tinkers-things) |
| Toast Control | Shadows_of_Fire | MIT | [CurseForge](https://www.curseforge.com/minecraft/mc-mods/toast-control) |
| toms-storage | tom5454 | MIT | [Modrinth](https://modrinth.com/mod/toms-storage) |
| TooManyRecipeViewers | Nolij (@xdMatthewbx#1337) & the Craftoria team | LicenseRef-OSL-3.0 | [Modrinth](https://modrinth.com/mod/tmrv) |
| Trackwork | Endalion | MIT | [CurseForge](https://www.curseforge.com/minecraft/mc-mods/trackwork) |
| Trading Post | Fuzs | MPL-2.0 | [Modrinth](https://modrinth.com/mod/trading-post) |
| Trash Cans | SuperMartijn642 | LicenseRef-All-Rights-Reserved | [Modrinth](https://modrinth.com/mod/trash-cans) |
| Valkyrien Skies | — | LGPL-3.0-only | [Modrinth](https://modrinth.com/mod/valkyrien-skies) |
| villagers-sell-animals | NoCube | ARR | [CurseForge](https://www.curseforge.com/minecraft/mc-mods/villagers-sell-animals) |
| VillagersPlus | Lion | GPL-3.0-only | [Modrinth](https://modrinth.com/mod/villagersplus) |
| Waystones | BlayTheNinth | ARR | [CurseForge](https://www.curseforge.com/minecraft/mc-mods/waystones) |
| yungs-api | YUNGNICKYOUNG | LGPL-3.0-only | [Modrinth](https://modrinth.com/mod/yungs-api) |
| Zeta | Vazkii, quat, IThundxr, siuol, wiresegal, MehVahdJukaar | CC-BY-NC-SA-3.0 | [Modrinth](https://modrinth.com/mod/zeta) |

**Bundled CurseForge jars (re-hosted in the pack):** *Create Recycle Everything*,
*Villagers Sell Animals*, and *Quark Delight* have third-party API distribution
disabled, so no installer can fetch them automatically. Their jars are bundled
directly so the pack installs cleanly. All three are All Rights Reserved; credit to
their respective authors (linked above).

---

## Resource packs

Novus ships a curated texture/animation stack (auto-applied via Paxi) plus two
opt-in packs. They fall into three groups: third-party packs included whole,
Novus packs that merge or derive from third-party work, and the original
`Novus3D_*` / `Novus_*` packs assembled for Novus. The original packs **pull
models/textures verbatim from the upstream "source packs"** credited at the
bottom — so those upstream licenses still govern the bundled assets.

> **Please read — resource-pack licensing.** Unlike the mods (distributed as
> links + hashes), the resource packs are bundled as files. Several source packs
> below are **All Rights Reserved, some explicitly "no redistribution without
> permission."** Including their assets in a publicly distributed pack goes beyond
> what those licenses grant. For a private group this is low-risk; **before any
> public release, get permission, swap to permissively-licensed sources, or keep
> those packs out of the public build.** Credits below are given in good faith and
> to honor attribution-required licenses.

### Third-party packs, included whole

| Pack(s) | Author | License / terms | Link |
|---|---|---|---|
| Fresh Animations (shipped as `FreshAnimations_v1.10.4_Novus`) | Fresh_LX | Custom — modpack inclusion allowed **with credit**; no redistribution of the standalone pack | https://modrinth.com/resourcepack/fresh-animations |
| FA Extensions — Emissive, Player, Quivers, Spiders | Fresh_LX | Same Fresh Animations terms | https://modrinth.com/resourcepack/fresh-animations-extensions |
| Vanilla Tweaks packs (3D Amethyst/Dripstone/Redstone Dust, Age-25 Kelp, Compass Lodestone, Disc Redstone, Groovy Levers, Visual Noteblock, Randomized Textures) | Vanilla Tweaks team | Custom — include only if modified + credited + kept free; no verbatim re-hosting | https://vanillatweaks.net |
| Quark Programmer Art (opt-in) | Vazkii / Quark Team | CC BY-NC-SA 3.0 | https://github.com/VazkiiMods/Quark |

### Novus packs that merge / derive from third-party work

| Pack | Built from | Upstream authors |
|---|---|---|
| `FA+AL+Azu_Zombies` | AL's Zombies Revamped+FA + Azu's Enhanced Zombie Variants FA, merged for 1.20.1 | Fresh_LX · AZUHCK |
| `FA+Witch_Old` | Vanilla witch CEM extracted from the Fresh Animations base | Fresh_LX (base) · assembled by z0nb1 |
| `PA-FA-Compat` | FA: Player Extension × PlayerAnimator compatibility patch | **AxoLabs** · MPL-2.0 |
| `Novus3D_Corundum`, `Novus3D_SlimeCrystal` | Stridey's Vanilla Tweaks 3D Amethyst crystal template, recolored | Stridey / Vanilla Tweaks |

### Original packs made for Novus

By **z0nb1** (b1ll3b0b). Each assembles/adapts assets from the source packs below
rather than generating new art, so upstream licenses apply to those assets.

| Pack | Draws assets from |
|---|---|
| `Novus3D_Objects` | Actually 3D · (3D torch geometry applied to the **Infinity Buttons** mod's lever/button blocks) |
| `Novus3D_Plants` | Vanilla Tweaks · Actually 3D · Allure 3D Plants · Tinkers' Construct 3D |
| `Novus3D_Stations` | Actually 3D · Better 3D Craft · Undopia 3D Furnaces · Barrel 3D |
| `Novus3D_Ladders` | RAY's 3D Ladders · Vanilla Tweaks · Ladder 3D Pack (mega_trainer) |
| `Novus3D_Rails` | Actually 3D · RAY's 3D Rails · Modded Rail 3D Pack (mega_trainer) |
| `Novus3D_Brewing` | Actually 3D (+ Amendments tint patch) |
| `Novus3D_Doors` | Actually 3D · Supplementaries 3D Doors & Trapdoors |
| `Novus3D_Crops` | crops-3d (base) · Actually 3D · REVIVED Farmer's Delight Crops 3D |
| `Novus_Glass` | Fusion Connected Glass (base) · Better Stained Glass (panes) |
| `Novus_BotaniaImprovedFlowers`, `Novus_DiscRedstone_*` | Novus-original / Vanilla Tweaks-style |

### Source packs (assets drawn from)

**✓** = author/license confirmed from the pack file itself (its `pack.mcmeta`, embedded
README or LICENSE). **⚠** = taken from a CurseForge/Modrinth listing and *not* verified
in-file — confirm before any public release.

| Source pack | Author | License | Link |
|---|---|---|---|
| Actually 3D — Blocks & Items r1.8 | Matt_Crowberry ✓ | not stated in pack ⚠ | https://modrinth.com/resourcepack/actually-3d (`5048Qu03`) |
| Actually 3D — Plants | Chomik_Oto ✓ | not stated in pack ⚠ | https://modrinth.com/resourcepack/actually-3d-plants |
| Nautilus 3D (V1.9, MC-1.13+) | Waschtl & playtrix ✓ | not stated in pack ⚠ | https://modrinth.com/resourcepack/nautilus3d |
| RAY's 3D Ladders / 3D Rails | xR4YM0ND ✓ | **MIT** ✓ (LICENSE in pack) | https://github.com/xR4YM0ND |
| Vanilla Tweaks (incl. Stridey's 3D Amethyst) | Vanilla Tweaks team ✓ | Custom — modify + credit + keep free | https://vanillatweaks.net |
| Better 3D Craft · Barrel 3D · Better 3D Beds | Heycronus ✓ | All Rights Reserved (Heycronus — see page) | https://modrinth.com/user/heycronus |
| Allure 3D Plants | P4ncake ✓ | All Rights Reserved ⚠ | https://modrinth.com/resourcepack/allure-3d-plants |
| Undopia 3D Furnaces | UnduGT (patch.undopia.net) ✓ | Custom "Undopia Patch License" ⚠ | https://modrinth.com/resourcepack/undopia-3d-furnaces |
| In-Game Brewing Guide | PinPal (pinpal.github.io) ✓ | All Rights Reserved ⚠ | https://modrinth.com/resourcepack/brewing-guide |
| AA4 Structure Markers | x7bbbbbbb ✓ | CC BY-NC-SA 4.0 ⚠ | https://modrinth.com/resourcepack/aa4-structure-markers |
| Fusion Connected Glass | SuperMartijn642 ✓ | All Rights Reserved ⚠ (needs the Fusion mod) | https://modrinth.com/resourcepack/fusion-connected-glass |
| Better Stained Glass | elwood612 ⚠ | not stated on listing ⚠ | https://www.curseforge.com/minecraft/texture-packs/better-stained-glass |
| Ladder 3D · Modded Rail 3D · Quark 3D · Tinkers' Construct 3D | mega_trainer ⚠ | **All Rights Reserved — "do not repost"** (per Novus PACKS.md) | https://www.curseforge.com/members/mega_trainer/projects |
| Supplementaries 3D Doors & Trapdoors | thricebite ⚠ | CC BY-NC-SA 4.0 ⚠ | https://modrinth.com/resourcepack/supplementaries-3d-doors-and-trapdoors |
| REVIVED Farmer's Delight Crops 3D | YStheStudio ⚠ | GPL-3.0 ⚠ | https://modrinth.com/resourcepack/revived-farmers-delight-crops-3d |
| AL's 3D Potions | ALtheGatorMC ⚠ | All Rights Reserved ⚠ | https://modrinth.com/resourcepack/als-3d-potions |
| Tinkers' Construct (referenced textures) | Slime Knights | MIT (the mod) | https://github.com/SlimeKnights/TinkersConstruct |
| crops-3d (base of Novus3D_Crops; in-pack desc "Grow your bossoms") | **unknown** ⚠ | unknown ⚠ | closest: https://modrinth.com/resourcepack/3d-crops |

### Datapacks (Paxi-applied)

`Repurposed Structures` compat datapacks for Chef's Delight, Farmer's Delight, and
VillagersPlus — by **telepathicgrunt** (Repurposed Structures). The Farmer's Delight
variant credits **pm095** as the original author.

---

## The pack's own content & license

Novus's configuration, KubeJS scripts, recipe/data overrides, and the build tooling
in this repo are the work of **z0nb1** (b1ll3b0b). The original `Novus3D_*` / `Novus_*`
resource packs are assembled by z0nb1 but contain third-party assets that remain under
the upstream licenses above.

**License:** Novus's own work — config, KubeJS scripts, recipe/data overrides, build
tooling, and the original `Novus3D_*` / `Novus_*` packs — is licensed
**[CC BY-NC-SA 4.0](LICENSE)** (attribution · non-commercial · share-alike). Third-party
mods and resource-pack assets are **not** covered by it and remain under their own
licenses (listed above); where an upstream license is more restrictive, it governs.

## Credits

Novus is a curation of other people's work — thank you to every mod and resource-pack
author listed above. Particular thanks to Fresh_LX (Fresh Animations), the Vanilla
Tweaks team, Matt_Crowberry (Actually 3D), and the Create, Tinkers' Construct, Farmer's
Delight, Quark, Supplementaries, Botania, and Biomancy communities.
