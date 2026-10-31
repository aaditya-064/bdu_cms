// "use client";
// import { useState } from "react";
// import Link from "next/link";
// import { getFeeds } from "@/api/feed.api";
// import { useResource } from "@/hooks/resource.hook";
// import { PageHeading } from "@/components/layout/page-heading";
// import { Card } from "@/components/ui/card";
// import { Input, Select } from "@/components/ui/field";
// import { buttonStyles } from "@/components/ui/button";
// import { ResourceState } from "@/components/ui/resource-state";
// import { PRODUCTS } from "@/types/feed.types";
// import { feedDate } from "@/utils/feed";

// export function FormulationsPage() {
//   const resource = useResource(getFeeds);
//   const [search, setSearch] = useState("");
//   const [brand, setBrand] = useState("");
//   const records =
//     resource.data?.filter(
//       (row) =>
//         (!brand || row.brand === brand) &&
//         row.title.toLowerCase().includes(search.toLowerCase()),
//     ) ?? [];
//   return (
//     <>
//       <PageHeading
//         eyebrow="Feed management"
//         title="Formulations"
//         description="Your recipes, ingredient costs and batch sheets in one place."
//         action={
//           <Link href="/formulations/new" className={buttonStyles()}>
//             New formulation
//           </Link>
//         }
//       />
//       <div className="mb-6 grid gap-4 sm:grid-cols-3">
//         {[
//           ["Recipe", "Enter quantities for one or more products."],
//           ["Calculate", "Review P/L and the 800 kg batch sheet."],
//           ["Save", "Keep a dated record of the prices used."],
//         ].map(([title, description], index) => (
//           <Card key={title} className="flex gap-3 p-4">
//             <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-sm font-semibold text-primary">
//               {index + 1}
//             </span>
//             <div>
//               <p className="text-sm font-semibold">{title}</p>
//               <p className="mt-1 text-xs leading-5 text-muted">{description}</p>
//             </div>
//           </Card>
//         ))}
//       </div>
//       <Card className="overflow-hidden">
//         <div className="flex flex-wrap items-end gap-4 p-5">
//           <Input
//             id="feed-search"
//             label="Search formulations"
//             placeholder="Search by title…"
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//           />
//           <Select
//             id="feed-filter"
//             label="Brand / group"
//             value={brand}
//             onChange={(e) => setBrand(e.target.value)}
//           >
//             <option value="">All brands / groups</option>
//             {Object.keys(PRODUCTS).map((key) => (
//               <option key={key} value={key}>
//                 {key[0].toUpperCase() + key.slice(1)}
//               </option>
//             ))}
//           </Select>
//           <Link
//             href="/ingredient-rates"
//             className={`${buttonStyles("secondary")} sm:ml-auto`}
//           >
//             Manage ingredient rates
//           </Link>
//         </div>
//         <ResourceState {...resource} retry={resource.reload} />
//         {resource.data && (
//           <>
//             <div className="overflow-x-auto">
//               <table className="feed-table min-w-[650px]">
//                 <thead>
//                   <tr>
//                     <th>Formulation</th>
//                     <th>Brand / group</th>
//                     <th>Products</th>
//                     <th>Saved on</th>
//                     <th>
//                       <span className="sr-only">Actions</span>
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {records.map((row) => (
//                     <tr key={row._id}>
//                       <td>
//                         <Link
//                           className="font-semibold text-primary hover:underline"
//                           href={`/formulations/${row._id}`}
//                         >
//                           {row.title}
//                         </Link>
//                       </td>
//                       <td className="capitalize">{row.brand}</td>
//                       <td>
//                         {row.products.map((product) => product.code).join(", ")}
//                       </td>
//                       <td className="text-muted">{feedDate(row.createdAt)}</td>
//                       <td>
//                         <Link
//                           className="text-primary hover:underline"
//                           href={`/formulations/new?copy=${encodeURIComponent(row._id)}`}
//                           aria-label={`Copy ${row.title}`}
//                         >
//                           Copy as new
//                         </Link>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//             {!records.length && (
//               <div className="space-y-3 p-10 text-center">
//                 <h2 className="font-semibold">
//                   {resource.data.length
//                     ? "No matching formulations"
//                     : "Your first formulation starts here"}
//                 </h2>
//                 <p className="text-sm text-muted">
//                   {resource.data.length
//                     ? "Try another title or brand."
//                     : "Add your current ingredient rates, then enter your recipe quantities."}
//                 </p>
//               </div>
//             )}
//           </>
//         )}
//       </Card>
//     </>
//   );
// }
