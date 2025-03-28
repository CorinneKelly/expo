/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <ABI43_0_0React/ABI43_0_0renderer/componentregistry/ComponentDescriptorRegistry.h>
#include <ABI43_0_0React/ABI43_0_0renderer/core/ComponentDescriptor.h>
#include <ABI43_0_0React/ABI43_0_0renderer/core/ShadowNode.h>
#include <ABI43_0_0React/ABI43_0_0renderer/core/ShadowNodeFamilyFragment.h>
#include <ABI43_0_0React/ABI43_0_0renderer/core/ShadowNodeFragment.h>

#include <ABI43_0_0React/ABI43_0_0renderer/element/Element.h>
#include <ABI43_0_0React/ABI43_0_0renderer/element/ElementFragment.h>

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

/*
 * Build `ShadowNode` trees with a given given `Element` trees.
 */
class ComponentBuilder final {
 public:
  ComponentBuilder(
      ComponentDescriptorRegistry::Shared const &componentDescriptorRegistry);

  /*
   * Copyable and movable.
   */
  ComponentBuilder(ComponentBuilder const &componentBuilder) = default;
  ComponentBuilder(ComponentBuilder &&componentBuilder) noexcept = default;
  ComponentBuilder &operator=(ComponentBuilder const &other) = default;
  ComponentBuilder &operator=(ComponentBuilder &&other) = default;

  /*
   * Builds a `ShadowNode` tree with given `Element` tree using stored
   * `ComponentDescriptorRegistry`.
   */
  template <typename ShadowNodeT>
  std::shared_ptr<ShadowNodeT> build(Element<ShadowNodeT> element) const {
    return std::static_pointer_cast<ShadowNodeT>(build(element.fragment_));
  }

 private:
  /*
   * Internal, type-erased version of `build`.
   */
  ShadowNode::Unshared build(ElementFragment const &elementFragment) const;

  ComponentDescriptorRegistry::Shared componentDescriptorRegistry_;
};

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
