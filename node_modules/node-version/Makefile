define release
  VERSION=`node -pe "require('./package.json').version"` && \
  NEXT_VERSION=`node -pe "require('semver').inc(\"$$VERSION\", '$(1)')"` && \
  node -e "\
    var j = require('./package.json');\
    j.version = \"$$NEXT_VERSION\";\
    var s = JSON.stringify(j, null, 2);\
    require('fs').writeFileSync('./package.json', s);" && \
  git commit -m "Bump $$NEXT_VERSION" -- package.json && \
  git tag "$$NEXT_VERSION" -m ""
endef

release-patch:
	@$(call release,patch)

release-minor:
	@$(call release,minor)

release-major:
	@$(call release,major)

publish:
	git push --tags origin HEAD:master
	npm publish
