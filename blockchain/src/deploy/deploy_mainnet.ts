import { EthAddress } from '@aztec/barretenberg/address';
import { TreeInitData } from '@aztec/barretenberg/environment';
import { Signer } from 'ethers';
import {
  deployDefiBridgeProxy,
  deployElementBridge,
  deployFeeDistributor,
  deployLidoBridge,
  deployMockVerifier,
  deployRollupProcessor,
  deployVerifier,
} from './deployers';

const gasLimit = 5000000;
const escapeBlockLower = 2160;
const escapeBlockUpper = 2400;

const MULTI_SIG_ADDRESS = '0xE298a76986336686CC3566469e3520d23D1a8aaD';
const DAI_ADDRESS = '0x6b175474e89094c44da98b954eedeac495271d0f';
const LIDO_WSTETH_ADDRESS = '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0';
const UNISWAP_ROUTER_ADDRESS = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
const DAI_PRICE_FEED_ADDRESS = '0x773616E4d11A78F511299002da57A0a94577F1f4';
const FAST_GAS_PRICE_FEED_ADDRESS = '0x169e633a2d1e6c10dd91238ba11c4a708dfef37c';

export async function deployMainnet(signer: Signer, { dataTreeSize, roots }: TreeInitData, vk?: string) {
  const verifier = vk ? await deployVerifier(signer, vk) : await deployMockVerifier(signer);
  const defiProxy = await deployDefiBridgeProxy(signer);
  const rollup = await deployRollupProcessor(
    signer,
    verifier,
    defiProxy,
    escapeBlockLower,
    escapeBlockUpper,
    roots.dataRoot,
    roots.nullRoot,
    roots.rootsRoot,
    dataTreeSize,
    false,
  );
  const feeDistributor = await deployFeeDistributor(signer, rollup, UNISWAP_ROUTER_ADDRESS);

  await rollup.setSupportedAsset(DAI_ADDRESS, 0, { gasLimit });
  await rollup.setSupportedAsset(LIDO_WSTETH_ADDRESS, 0, { gasLimit });

  const expiryCutOff = new Date('01 Sept 2022 00:00:00 GMT');
  await deployElementBridge(signer, rollup, ['dai'], expiryCutOff);
  await deployLidoBridge(signer, rollup);

  await rollup.transferOwnership(MULTI_SIG_ADDRESS, { gasLimit });

  const feePayingAssets = [EthAddress.ZERO.toString(), DAI_ADDRESS];
  const priceFeeds = [FAST_GAS_PRICE_FEED_ADDRESS, DAI_PRICE_FEED_ADDRESS];

  return { rollup, priceFeeds, feeDistributor, feePayingAssets };
}