# Milestone Log

## M0 — Reference audit
- **Date**: 2026-10-08
- **Change Summary**: Imported original Stitch export unmodified into `references/stitch/stitch_pixeltools_browser_image_utilities`.
- **Inventory of HTML screens**:
  1. `pixeltools_homepage_desktop` -> `/` desktop layout
  2. `pixeltools_homepage_mobile` -> `/` mobile layout
  3. `pixeltools_all_tools_directory_desktop` -> `/tools` directory
  4. `pixeltools_image_compressor_result_comparison_desktop` -> `/tools/image-compressor` desktop
  5. `pixeltools_image_compressor_result_mobile` -> `/tools/image-compressor` mobile
  6. `pixeltools_image_converter_desktop` -> `/tools/image-converter`
  7. `pixeltools_image_resizer_desktop` -> `/tools/image-resizer`
  8. `pixeltools_image_cropper_desktop` -> `/tools/image-cropper` desktop
  9. `pixeltools_image_cropper_mobile` -> `/tools/image-cropper` mobile
  10. `pixeltools_rotate_flip_desktop` -> `/tools/image-rotator`
  11. `pixeltools_image_inspector_desktop` -> `/tools/image-inspector`
  12. `pixeltools_edge_cases_developer_handoff_desktop` -> Error handling/state reference
- **Limitations / Notes**: Verified that all `screen.png` files in the Stitch export are actually text files containing `<FILE Image failed to fetch>` and are not valid images. Screenshots of the reference HTML files will need to be captured using browser automation in the future. `AGENTS.md` and `CODEX.md` are present.
- **Tests Run**: N/A (Documentation and reference setup only).
- **Commit SHA**: d4729be
- **Next Action**: M1 - Foundation

## M1 — Foundation
- **Date**: 2026-10-08
- **Change Summary**: Next.js App Router TS scaffold initialized. Tailwind configured with design tokens from Stitch exports. Inter font and Material Symbols imported in layout. Test suites (Vitest, Playwright) and directories created. Configuration files (`site.ts`, `tools.ts`, `limits.ts`) added.
- **Tests Run**: `npm run typecheck`, `npm run lint`, and `npm run build` executed successfully.
- **Commit SHA**: ba81d1a
- **Next Action**: M2 - Responsive Website Foundation

## M2 — Layout and navigation
- **Date**: 2026-10-08
- **Change Summary**: Built the responsive homepage, `/tools` directory, and functional navigation (Header/Footer). Included mobile menu, theme toggle, and static page shells for all MVP tools and informational pages.
- **Tests Run**: `npm run typecheck`, `npm run lint`, and `npm run build` executed successfully. Layout verified visually.
- **Commit SHA**: ec2ca9c
- **Next Action**: M3 - Local Image Engine

## M3 — Local Image Engine
- **Date**: 2026-10-08
- **Change Summary**: Implemented secure client-side image processing foundation. Created image validation (`validate.ts`) with MIME/magic-byte checks and size limits. Established typed processing contracts (`contracts.ts`). Structured a Web Worker setup (`image.worker.ts`, `protocol.ts`, `client.ts`) for non-blocking canvas processing. Included `downloadBlob` helper.
- **Tests Run**: Unit tests written for file validation using Vitest. `npm run test`, `npm run typecheck`, and `npm run build` executed successfully.
- **Commit SHA**: c1c2ef8
- **Next Action**: M4 - Compressor

## M4 — Image Compressor
- **Date**: 2026-10-08
- **Change Summary**: Complete real compressor implementation (`CompressorClient.tsx`) with a custom interactive before/after `Comparator.tsx` slider. The compressor correctly passes Blobs to the `image.worker.ts` for off-thread re-encoding into WebP, JPEG, or PNG formats at specified quality limits. Calculates and displays exact byte savings and percentage metrics.
- **Tests Run**: `npm run lint`, `npm run typecheck`, and `npm run build` executed successfully.
- **Commit SHA**: 9ece420
- **Next Action**: M5 - Converter

## M5 — Image Converter
- **Date**: 2026-10-08
- **Change Summary**: Implement `ConverterClient.tsx` featuring cross-format conversion capabilities (WebP, JPEG, PNG). Included a dynamic transparency preview grid and added background flattening capability within the `image.worker.ts` so alpha channels correctly map to solid colors when targeting JPEG.
- **Tests Run**: `npm run lint`, `npm run typecheck`, and `npm run build` executed successfully.
- **Commit SHA**: cb82d43
- **Next Action**: M6 - Resizer

## M6 — Image Resizer
- **Date**: 2026-10-08
- **Change Summary**: Built `ResizerClient.tsx` providing aspect ratio locking, percentage scale presets, and absolute pixel definitions. The local `image.worker.ts` leverages `OffscreenCanvas` with `imageSmoothingQuality = 'high'` to perform bicubic downsampling directly on the client side, outputting correctly sized artifacts.
- **Tests Run**: `npm run lint`, `npm run typecheck`, and `npm run build` executed successfully.
- **Commit SHA**: e7b8acb
- **Next Action**: M7 - Cropper
