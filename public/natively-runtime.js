/**
 * Local compatibility entrypoint for the native.builder runtime hook.
 *
 * native.builder may provide platform-specific runtime behavior when the app
 * is published. The current IceCold Sprint client does not require any
 * runtime globals, but keeping this module available makes local Vite builds
 * and previews behave like the published entrypoint.
 */
export {};
