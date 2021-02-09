collateral-erc20:
	npm run codegen:collateral-erc20-loans
	npm run build:collateral-erc20-loans
	npm run deploy:collateral-erc20-loans

collateral-erc20-kovan:
	npm run codegen:collateral-erc20-loans:kovan
	npm run build:collateral-erc20-loans:kovan
	npm run deploy:collateral-erc20-loans:kovan

collateral-eth:
	npm run codegen:collateral-eth-loans
	npm run build:collateral-eth-loans
	npm run deploy:collateral-eth-loans

collateral-eth-kovan:
	npm run codegen:collateral-eth-loans:kovan
	npm run build:collateral-eth-loans:kovan
	npm run deploy:collateral-eth-loans:kovan

.PHONY: \
	collateral-erc20 \
	collateral-erc20-kovan \
	collateral-eth \
	collateral-eth-kovan