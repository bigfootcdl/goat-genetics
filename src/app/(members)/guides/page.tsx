export const metadata = { title: "Guides" };

const GUIDES = [
  {
    title: "Shipping frozen semen and embryos",
    body: [
      "Ship straws and embryos in a charged dry shipper. A dry shipper holds liquid nitrogen in an absorbent lining with no free liquid, so normal carriers accept it. A tank with free liquid nitrogen counts as hazardous material.",
      "Agree who pays for the shipper rental and return shipping before anything leaves the farm.",
      "Ask the collection or storage center to ship for you if you don't have a shipper.",
    ],
  },
  {
    title: "Registry papers for AI and ET kids",
    body: [
      "Registries such as ABGA have their own rules. Usually the sire needs DNA on file, and the buyer needs a semen or embryo transfer certificate from the owner to register the kids.",
      "ET kids often need DNA parentage verification.",
      "Before you buy, ask the seller which papers come with the sale. Check current rules with your registry.",
    ],
  },
  {
    title: "Moving live goats between states",
    body: [
      "Goats usually need official scrapie ID and a Certificate of Veterinary Inspection (health certificate) to cross state lines. Some states require extra tests.",
      "Check the destination state's animal health office before you set a pickup date.",
    ],
  },
  {
    title: "Health tests buyers ask for",
    body: [
      "Buyers commonly ask for recent negative tests for CAE, CL, Johne's and brucellosis. Add test results to the animal's profile so they show on every listing.",
    ],
  },
];

export default function GuidesPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="h1">Guides</h1>
      <p className="muted mt-1">
        General pointers, not legal or veterinary advice. Check with USDA APHIS, your state vet and your registry.
      </p>
      <div className="mt-6 space-y-4">
        {GUIDES.map((g) => (
          <section key={g.title} className="card p-6">
            <h2 className="h2">{g.title}</h2>
            <div className="mt-2 space-y-2 text-sm text-stone-700">
              {g.body.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
