---
title: Verifying Transactions
description: How to independently verify an xChain EVM transaction before signing.
order: 7
category: Verify
---

# Verifying Transactions

Before signing, you can independently verify a transaction through the xChain EVM Portal - no need to fully rely on the app's display.

## How To Verify

1. Look for a **Verify** button in the transaction review dialog
2. Tap it any time before signing
3. A new tab opens at `xchain.algorand.co/verify#...`, where the Portal independently decodes and displays the transaction details - check they match what you intend to do
4. Ensure that the **transaction ID** (or **group ID**) matches the one shown by your app and wallet
5. **Only sign if the IDs match** - reject the transaction otherwise

## Be Careful

- Be suspicious of any app that doesn't show a Verify button
- Check the verify tab's URL is `xchain.algorand.co` - the official Portal domain

## Why Verifying

A malicious app could show you one transaction while asking your wallet to sign another. The transaction ID is a cryptographic commitment to the exact transaction(s) - if anything is altered, the ID changes. The Portal computes this ID from the same details it displays, so a matching ID guarantees the transaction details you see are exactly what you're about to sign.

By verifying, you shift trust to the xChain EVM Portal at its official `xchain.algorand.co` domain, not whatever app is requesting the signature.

---

## Under the Hood

### How Verify Works

The Verify link encodes the transaction in the URL hash (`#...`), each separated with a `:` for transaction groups. The Portal decodes them and independently computes the transaction (or group) ID from the decoded data - then renders the transaction review.

### What Is Being Verified

- The decoded transaction(s) - sender, receiver, amounts, assets, app calls, etc.
- The computed transaction/group ID, shown as a `0x...` hash to compare against your wallet's EIP-712 signing prompt

Because the Portal computes this from scratch using only the encoded transaction data in the URL, a matching ID confirms nothing was altered between display and signing.

## Related

- [Signing Transactions](/docs/signing-transactions) - how signing xChain EVM transactions works in the first place
- [Security Model](/docs/security) - broader explanation of xChain EVM's trust model
