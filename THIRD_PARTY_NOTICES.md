# Third-party sources and notices

## ForumMagnum / LessWrong

The visual design and source adaptations in this repository come from [ForumMagnum](https://github.com/ForumMagnum/ForumMagnum), including theme values, layout conventions, icons, and reaction definitions. Source comments in `src/app/globals.css` and the corresponding components identify the upstream files.

ForumMagnum is distributed under the GNU General Public License, version 3. The upstream license text is reproduced in [LICENSES/ForumMagnum-GPL-3.0.txt](LICENSES/ForumMagnum-GPL-3.0.txt). Preserve that license and attribution when redistributing its code or adaptations. Copyright remains with the respective contributors.

The `public/reactionImages/` collection comes from ForumMagnum and includes artwork credited upstream to sources such as The Noun Project. Do not assume the code license grants separate rights to every image. Check the upstream asset's terms for your use.

## Typography

[ET Book](https://github.com/edwardtufte/et-book) is loaded through the [Tufte CSS](https://github.com/edwardtufte/tufte-css) CDN paths referenced in `src/app/globals.css`. Font files are not vendored here.

Warnock Pro and Gill Sans Nova are optional Adobe Fonts integrations. Supply your own authorized kit through `NEXT_PUBLIC_TYPEKIT_ID`; the application otherwise uses its fallback font stacks.

## Other assets and integrations

- Protocol Labs branding identifies the hosted PL R&D forum. It is not a grant to use Protocol Labs trademarks for another service.
- The bundled Einstein feedback sprite and its rendering approach come from the Simocracy integration. Artwork and branding retain their owners' rights.
- Leaflet and standard.site supply the content formats used for interoperability. ATProto supplies the identity, repository, and OAuth protocols.
- npm dependencies retain their own licenses. Their resolved versions are recorded in `package-lock.json`.

This notice records provenance; it does not relicense third-party artwork, trademarks, or commercial fonts. Confirm the relevant terms before redistributing those assets in another product.
