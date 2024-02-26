import { ethers } from "hardhat";

const main = async () => {
  const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const DAIAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  const UNIFactory = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
  const USDCHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

  const impersonatedSigner = await ethers.getImpersonatedSigner(USDCHolder);

  const USDC = await ethers.getContractAt("IERC20", USDCAddress);
  const DAI = await ethers.getContractAt("IERC20", DAIAddress);
  const ROUTER = await ethers.getContractAt("IUniswap", UNIRouter);
  const FACTORY = await ethers.getContractAt("IUniswapV2Factory", UNIFactory);

  console.log(`Impersonated Signer Address: ${impersonatedSigner.address}`);
  let balanceUSDC = await USDC.balanceOf(impersonatedSigner.address);
  let balanceDAI = await DAI.balanceOf(impersonatedSigner.address);
  console.log(`Initial USDC Balance: ${ethers.formatUnits(balanceUSDC, 6)}`);
  console.log(`Initial DAI Balance: ${ethers.formatUnits(balanceDAI, 18)}`);

  await USDC.connect(impersonatedSigner).approve(UNIRouter, ethers.MaxUint256);
  console.log(`Approved USDC spending by Router.`);
  await DAI.connect(impersonatedSigner).approve(UNIRouter, ethers.MaxUint256);
  console.log(`Approved DAI spending by Router.`);

  const amountOutUSDC = ethers.parseUnits("1000", 6);
  const amountOutDAI = ethers.parseUnits("1000", 18);
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;
  const txAddLiq = await ROUTER.connect(impersonatedSigner).addLiquidity(
    USDCAddress,
    DAIAddress,
    amountOutUSDC,
    amountOutDAI,
    0,
    0,
    impersonatedSigner.address,
    deadline
  );
  const receiptAddLiq = await txAddLiq.wait();
  console.log(`Liquidity Added. Transaction Hash: ${receiptAddLiq?.hash}`);

  const liquidityTokenAddress = await FACTORY.getPair(USDCAddress, DAIAddress);
  console.log(`Liquidity Token Address: ${liquidityTokenAddress}`);

  const LP = await ethers.getContractAt("IERC20", liquidityTokenAddress);
  const lpBalance = await LP.balanceOf(impersonatedSigner.address);
  console.log(`LP Token Balance: ${ethers.formatUnits(lpBalance, 18)}`);

  await LP.connect(impersonatedSigner).approve(UNIRouter, lpBalance);
  console.log(`Approved LP token spending by Router.`);

  const txRemoveLiq = await ROUTER.connect(impersonatedSigner).removeLiquidity(
    USDCAddress,
    DAIAddress,
    lpBalance,
    0,
    0,
    impersonatedSigner.address,
    deadline
  );
  const receiptRemoveLiq = await txRemoveLiq.wait();
  console.log(`Liquidity Removed. Transaction Hash: ${receiptRemoveLiq?.hash}`);

  balanceUSDC = await USDC.balanceOf(impersonatedSigner.address);
  balanceDAI = await DAI.balanceOf(impersonatedSigner.address);
  console.log(`Final USDC Balance: ${ethers.formatUnits(balanceUSDC, 6)}`);
  console.log(`Final DAI Balance: ${ethers.formatUnits(balanceDAI, 18)}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
