import {
  productTypes,
  productTypeContent,
  type ProductType,
} from "@/src/content/product-types";

export default function ProductTypeField({
  defaultValue = "perfume",
}: {
  defaultValue?: ProductType;
}) {
  return (
    <div>
      <label htmlFor="productType" className="mb-2 block text-sm font-medium">
        {productTypeContent.label}
      </label>
      <select
        id="productType"
        name="productType"
        required
        defaultValue={defaultValue}
        aria-describedby="product-type-help"
        className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3"
      >
        {productTypes.map((type) => (
          <option key={type} value={type}>
            {productTypeContent.labels[type]}
          </option>
        ))}
      </select>
      <p id="product-type-help" className="mt-2 text-xs leading-5 text-neutral-500">
        {productTypeContent.help}
      </p>
    </div>
  );
}
