import Link from 'next/link';

export default function Page() {
  return (
    <div className="flex h-screen bg-black">
      <div className="w-screen h-screen flex flex-col justify-center items-center">
        <div className="text-center max-w-screen-sm mb-10">
          <h1 className="text-stone-200 font-bold text-2xl">
            TFO.creaturetracker
          </h1>
          <h2 className="text-stone-200 font-bold text-l mt-5">
            is a utility for the web game <a href="https://finaloutpost.net/">The Final Outpost</a> that will allow you to
          </h2>
          <div className="text-stone-400 text-m mt-5">
            <ul>
              <li>Save research goals and breeding pairs</li>
              <li>Create breeding predictions for any pair</li>
              <li>Browse and filter your collection at a glance</li>
            </ul>
          </div>
          <p className="text-stone-400 font-bold text-l mt-5">
            Coming soon, keep an eye on this page!
          </p>
        </div>
      </div>
    </div>
  );
}
