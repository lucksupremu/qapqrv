"""Inject signingConfigs.release into android/app/build.gradle."""
import re
import pathlib

p = pathlib.Path("android/app/build.gradle")
src = p.read_text()

signing = """
    signingConfigs {
        release {
            storeFile file("qapqrv-release.jks")
            storePassword System.getenv("KEYSTORE_PASSWORD")
            keyAlias      System.getenv("KEY_ALIAS")
            keyPassword   System.getenv("KEY_PASSWORD")
        }
    }
"""

# Insert signingConfigs as first child of android { ... }
src = re.sub(r"(android\s*\{\s*\n)", r"\1" + signing, src, count=1)

# Attach signingConfig to buildTypes.release
src = re.sub(
    r"(buildTypes\s*\{\s*\n\s*release\s*\{\s*\n)",
    r"\1            signingConfig signingConfigs.release\n",
    src,
    count=1,
)

p.write_text(src)
print("build.gradle patched with signingConfigs.release")
