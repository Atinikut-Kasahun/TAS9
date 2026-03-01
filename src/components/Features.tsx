"use client";

import { motion } from "framer-motion";
import { Lightbulb, Users, Rocket, Globe } from "lucide-react";

const features = [
    {
        icon: Lightbulb,
        title: "Innovation First",
        desc: "We push boundaries and embrace cutting-edge technologies.",
        tag: "Engineering",
        color: "text-[#00453B]",
        bg: "bg-[#EFE8DE]"
    },
    {
        icon: Users,
        title: "Collaborative Culture",
        desc: "Work with talented individuals who value teamwork and respect.",
        tag: "Culture",
        color: "text-[#00453B]",
        bg: "bg-[#EFE8DE]"
    },
    {
        icon: Rocket,
        title: "Growth Mindset",
        desc: "Continuous learning and development are at our core.",
        tag: "Personal Growth",
        color: "text-white",
        bg: "bg-[#00453B]"
    },
    {
        icon: Globe,
        title: "Global Impact",
        desc: "Build products that reach millions of users worldwide.",
        tag: "Mission",
        color: "text-[#00453B]",
        bg: "bg-[#EFE8DE]"
    },
];

const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
};

const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.215, 0.61, 0.355, 1] } },
};

export default function Features() {
    return (
        <section className="py-24 bg-white" id="why-tas">
            <div className="max-w-7xl mx-auto px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="mb-14 text-center"
                >
                    <span className="text-[#00453B] font-bold text-xs uppercase tracking-widest bg-[#EFE8DE] px-4 py-1.5 rounded-full mb-6 inline-block">
                        Why Droga?
                    </span>
                    <h2 className="text-5xl font-bold text-[#00453B] mb-4">
                        Why Droga Group?
                    </h2>
                    <p className="text-xl text-[#00453B]/60 max-w-2xl mx-auto font-medium">
                        We&apos;re more than just a workplace. We&apos;re a community committed to
                        excellence and innovation.
                    </p>
                </motion.div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: false, amount: 0.15, margin: "-100px 0px" }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
                >
                    {features.map((feature, i) => (
                        <motion.div
                            key={i}
                            variants={{
                                hidden: { opacity: 0, y: 30, rotateX: 15 },
                                visible: {
                                    opacity: 1,
                                    y: 0,
                                    rotateX: 0,
                                    transition: { duration: 0.6, ease: [0.215, 0.61, 0.355, 1] }
                                },
                            }}
                            whileHover={{ y: -8, rotateX: 0, transition: { duration: 0.3 } }}
                            className="group p-8 bg-[#FDF9F3] rounded-[32px] border border-[#00453B]/5 hover:border-[#00453B]/20 hover:bg-white transition-all hover:shadow-2xl hover:shadow-[#00453B]/5 cursor-default relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[10px] font-bold text-[#00453B] uppercase tracking-tighter bg-[#EFE8DE] px-2 py-1 rounded-md">{feature.tag}</span>
                            </div>
                            <div className={`w-14 h-14 ${feature.bg} rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform`}>
                                <feature.icon className={`w-7 h-7 ${feature.color}`} strokeWidth={2.5} />
                            </div>
                            <h3 className="text-xl font-bold text-[#00453B] mb-4 group-hover:text-[#00453B] transition-colors">
                                {feature.title}
                            </h3>
                            <p className="text-[#00453B]/60 text-sm leading-relaxed font-medium">
                                {feature.desc}
                            </p>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
