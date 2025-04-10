/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI45_0_0RCTDefines.h"
#include "ABI45_0_0RCTMacros.h"

#if ABI45_0_0RCT_PROFILE && defined(__arm64__)

  .align 5
  .globl SYMBOL_NAME(ABI45_0_0RCTProfileTrampoline)
SYMBOL_NAME(ABI45_0_0RCTProfileTrampoline):
  /**
   * The explanation here is shorter, refer to the x86_64 implementation to  a
   * richer explanation
   */

  // Basic prolog: save the frame pointer and the link register (caller address)
  stp fp, lr, [sp, #-16]!
  mov fp, sp

  /**
   * Store the value of all the parameter registers (x0-x8, q0-q7) so we can
   * restore everything to the initial state at the time of the actual function
   * call
   */
  sub	sp, sp, #(10*8 + 8*16)
  stp	q0, q1, [sp, #(0*16)]
  stp	q2, q3, [sp, #(2*16)]
  stp	q4, q5, [sp, #(4*16)]
  stp	q6, q7, [sp, #(6*16)]
  stp	x0, x1, [sp, #(8*16+0*8)]
  stp	x2, x3, [sp, #(8*16+2*8)]
  stp	x4, x5, [sp, #(8*16+4*8)]
  stp	x6, x7, [sp, #(8*16+6*8)]
  str	x8,     [sp, #(8*16+8*8)]

  /**
   * Allocate 16-bytes for the values that have to be preserved across the call
   * to the actual function, since the stack has to be in the exact initial
   * state. During its lifetime we use it to store the initial value of the
   * callee saved registers we use to point the memory, the actual address of
   * the implementation and the caller address.
   */
  mov x0, #0x10
  bl SYMBOL_NAME(ABI45_0_0RCTProfileMalloc)
  // store the initial value of r19, the callee saved register we'll use
  str x19, [x0]
  mov x19, x0

  /**
   * void ABI45_0_0RCTProfileGetImplementation(id object, SEL selector)
   *
   * Load the 2 first arguments from the stack, they are the same used to call
   * this function
   */
  ldp	x0, x1, [sp, #(8*16+0*8)]
  bl SYMBOL_NAME(ABI45_0_0RCTProfileGetImplementation)
  str x0, [x19, #0x8] // store the actual function address

  /**
   * void ABI45_0_0RCTProfileTrampolineStart(id, SEL) in ABI45_0_0RCTProfile.m
   *
   * start the profile, it takes the same first 2 arguments as above.
   */
  ldp	x0, x1, [sp, #(8*16+0*8)]
  bl SYMBOL_NAME(ABI45_0_0RCTProfileTrampolineStart)

  // Restore all the parameter registers to the initial state.
  ldp	q0, q1, [sp, #(0*16)]
  ldp	q2, q3, [sp, #(2*16)]
  ldp	q4, q5, [sp, #(4*16)]
  ldp	q6, q7, [sp, #(6*16)]
  ldp	x0, x1, [sp, #(8*16+0*8)]
  ldp	x2, x3, [sp, #(8*16+2*8)]
  ldp	x4, x5, [sp, #(8*16+4*8)]
  ldp	x6, x7, [sp, #(8*16+6*8)]
  ldr	x8,     [sp, #(8*16+8*8)]

  // Restore the stack pointer, frame pointer and link register
  mov	sp, fp
  ldp	fp, lr, [sp], #16


  ldr x9, [x19, #0x8] // Load the function
  str lr, [x19, #0x8] // store the address of the caller

  blr x9 // call the actual function

  /**
   * allocate 32-bytes on the stack, for the 2 return values + the caller
   * address that has to preserved across the call to `free`
   */
  sub sp, sp, #0x20
  str q0, [sp, #0x0] // 16-byte return value
  str x0, [sp, #0x10] // 8-byte return value

  // void ABI45_0_0RCTProfileTrampolineEnd(void) in ABI45_0_0RCTProfile.m - just ends this profile
  bl SYMBOL_NAME(ABI45_0_0RCTProfileTrampolineEnd)

  /**
   * restore the callee saved registers, move the values we still need to the
   * stack and free the allocated memory
   */
  mov x0, x19 // move the address of the memory to x0, first argument
  ldr x10, [x19, #0x8] //  load the caller address
  ldr x19, [x19] // restore x19
  str x10, [sp, #0x18] // store x10 on the stack space allocated above
  bl SYMBOL_NAME(ABI45_0_0RCTProfileFree)

  // Load both return values and link register from the stack
  ldr q0, [sp, #0x0]
  ldr x0, [sp, #0x10]
  ldr lr, [sp, #0x18]

  // restore the stack pointer
  add sp, sp, #0x20

  // jump to the caller, without a link
  br lr

#endif
