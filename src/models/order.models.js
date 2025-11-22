import mongoose, { Schema } from "mongoose";

const orderSchema = new Schema(
    {
        customer: {
            type: mongoose.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        items: [
            {
                product: {
                    Id: {
                        type: mongoose.Types.ObjectId,
                        ref: "Product",
                        required: true,
                    },
                    name: { type: String, required: true },
                    color: { type: String, required: true },
                    size: { type: String, required: true },
                    brand: { type: String, required: true },
                },
                quantity: {
                    type: Number,
                    default: 1,
                    min: 1,
                },
                price: {
                    type: Number,
                    required: true,
                },
            },
        ],
        totalPrice: { type: Number, default: 0 },

        delhiveryAddress: {
            type: Object,
            required: true,
        },
        offers: [{ type: mongoose.Types.ObjectId, ref: "Offer" }],
        orderStatus: {
            type: String,
            enum: [
                "confirmed",
                "processing",
                "shipped",
                "out for delivery",
                "delivered",
            ],
            default: "confirmed",
        },
        totalPayableAmount: {
            type: Number,
            required: true,
            default: 0,
        },
        paymentStatus: {
            type: String,
            enum: ["pending", "processing", "completed"],
            default: "pending",
        },
    },
    { timestamps: true }
);

orderSchema.pre("save", async function (next) {
    this.totalPrice = this.items.reduce(
        // calculates total price
        // performing in the items array
        (acc, item) => acc + item.price * item.quantity,
        0
    );
    let totalDiscount = 0;
    if (this.offers && this.offers.length) {
        if (!this.populated("offers")) {
            await this.populate("offers"); //if offers array is not populated ..populate it
        }
        totalDiscount = this.offers.reduce(
            // calculates total discount
            (acc, offer) =>
                acc + ((offer.discountPercent || 0) * this.totalPrice) / 100,
            0
        );
    }
    this.totalPayableAmount = (this.totalPrice - totalDiscount).toFixed(2); // calculates total payable amount after discounts
    next();
});

export const Order = mongoose.model("Order", orderSchema);
