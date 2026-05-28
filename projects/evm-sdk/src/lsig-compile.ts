import {
  LSIG_OWNER_LENGTH,
  LSIG_OWNER_OFFSET,
  LSIG_TEMPLATE_BASE64,
  LSIG_TEMPLATE_LENGTH,
} from "./generated/lsig-template"
import { base64ToBytes, hexToBytes } from "./utils"

/** Decoded compiled-lsig template; sentinel bytes occupy the OWNER slot. */
export const LSIG_TEMPLATE_BYTES = base64ToBytes(LSIG_TEMPLATE_BASE64)

if (LSIG_TEMPLATE_BYTES.length !== LSIG_TEMPLATE_LENGTH) {
  throw new Error(
    `lsig template byte length (${LSIG_TEMPLATE_BYTES.length}) does not match LSIG_TEMPLATE_LENGTH (${LSIG_TEMPLATE_LENGTH}) — regenerate src/generated/lsig-template.ts.`,
  )
}

/**
 * Splice a 20-byte EVM owner address into the compiled lsig template.
 * Pure / synchronous — does not contact algod.
 *
 * @param evmAddress - 20-byte EVM address (hex, with or without 0x prefix)
 * @returns compiled lsig program bytes (length = LSIG_TEMPLATE_LENGTH)
 */
export function compileLsigForOwner(evmAddress: string): Uint8Array {
  const hex = (evmAddress.startsWith("0x") ? evmAddress.slice(2) : evmAddress).toLowerCase()
  if (hex.length !== LSIG_OWNER_LENGTH * 2) {
    throw new Error(
      `EVM address must be ${LSIG_OWNER_LENGTH} bytes (${LSIG_OWNER_LENGTH * 2} hex chars), got ${hex.length}`,
    )
  }
  if (!/^[0-9a-f]+$/.test(hex)) {
    throw new Error("EVM address must contain only hexadecimal characters")
  }
  const ownerBytes = hexToBytes(hex)
  const program = new Uint8Array(LSIG_TEMPLATE_LENGTH)
  program.set(LSIG_TEMPLATE_BYTES, 0)
  program.set(ownerBytes, LSIG_OWNER_OFFSET)
  return program
}
