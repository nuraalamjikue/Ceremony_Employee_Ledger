/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Employee {
  id: string;
  name: string;
  address: string; // Employee's home base or location context
  createdAt: string;
}

export interface Entry {
  id: string;
  name: string; // Employee name
  amount: number;
  address: string;
  date: string; // Dynamic date string
  gift?: string; // Optional gift field
}
