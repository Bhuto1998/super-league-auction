import React, { useState, useEffect } from 'react';
import { useCareer } from '../../context/CareerContext';
import { isHumanTeam } from '../../utils/budgetCalculator';
import { getPickDescription } from '../../engine/draftEngine';
import DraftPick from './DraftPick';

export default function DraftBoard({ onComplete }) {
  const {
    state,
    getCurrentDraftPick,
    processAIDraftPick,
    makeDraftPick,
    completeDraft,
  } = useCareer();

  const { draftState, teams } = state;
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [showPickModal, setShowPickModal] = useState(false);

  const currentPickData = getCurrentDraftPick();
  const isHumanPick = currentPickData && isHumanTeam(currentPickData.teamId);
  const isComplete = draftState?.isComplete || false;

  // Process AI picks automatically
  useEffect(() => {
    if (!currentPickData || isComplete || isProcessingAI) return;

    if (!isHumanTeam(currentPickData.teamId)) {
      setIsProcessingAI(true);

      // Delay for UI effect
      const timer = setTimeout(() => {
        processAIDraftPick();
        setIsProcessingAI(false);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [currentPickData, isComplete, isProcessingAI, processAIDraftPick]);

  // Show pick modal when it's human's turn
  useEffect(() => {
    if (isHumanPick && !isComplete) {
      setShowPickModal(true);
    }
  }, [isHumanPick, isComplete]);

  const handleHumanPick = (wonderkid) => {
    makeDraftPick(currentPickData.teamId, wonderkid);
    setShowPickModal(false);
  };

  const handleCompleteDraft = () => {
    completeDraft();
    onComplete();
  };

  const getTeamById = (teamId) => teams.find(t => t.id === teamId);

  // Get completed picks
  const completedPicks = draftState?.picks || [];

  // Get upcoming picks
  const upcomingPicks = (draftState?.draftOrder || [])
    .filter(p => p.pick > (draftState?.currentPick || 0))
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            Season {state.currentSeason} Wonderkid Draft
          </h1>
          <p className="text-slate-400">
            Round {draftState?.round || 1} - Pick {draftState?.currentPick || 1}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Available Wonderkids */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
              <h2 className="text-lg font-bold text-white mb-4">
                Available Wonderkids ({draftState?.availableWonderkids?.length || 0})
              </h2>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {(draftState?.availableWonderkids || []).map((wk) => (
                  <div
                    key={wk.id}
                    className="bg-slate-700/50 rounded-lg p-3 border border-slate-600"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-white font-semibold">{wk.name}</div>
                        <div className="text-slate-400 text-sm">
                          {wk.position} | {wk.nationality} | Age {wk.age}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-yellow-400">{wk.rating}</div>
                        <div className="text-xs text-green-400">POT {wk.potential}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center: Current Pick */}
          <div className="lg:col-span-1">
            {!isComplete ? (
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                <h2 className="text-lg font-bold text-white mb-4 text-center">
                  On The Clock
                </h2>

                {currentPickData && (
                  <div className="text-center">
                    <div
                      className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl border-4"
                      style={{
                        backgroundColor: getTeamById(currentPickData.teamId)?.color + '30',
                        borderColor: getTeamById(currentPickData.teamId)?.color,
                      }}
                    >
                      {getTeamById(currentPickData.teamId)?.logoEmoji}
                    </div>

                    <div className="text-2xl font-bold text-white mb-2">
                      {getTeamById(currentPickData.teamId)?.name}
                    </div>

                    <div className="text-yellow-400 font-semibold mb-2">
                      Pick #{currentPickData.pick}
                    </div>

                    <div className="text-slate-400 text-sm mb-4">
                      {getPickDescription(currentPickData)}
                    </div>

                    {isProcessingAI && (
                      <div className="flex items-center justify-center gap-2 text-blue-400">
                        <div className="animate-spin w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full" />
                        <span>AI is selecting...</span>
                      </div>
                    )}

                    {isHumanPick && !showPickModal && (
                      <button
                        onClick={() => setShowPickModal(true)}
                        className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg font-bold"
                      >
                        Make Your Pick
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-green-900/30 border border-green-500 rounded-xl p-6 text-center">
                <div className="text-4xl mb-4">&#127942;</div>
                <h2 className="text-2xl font-bold text-green-400 mb-4">
                  Draft Complete!
                </h2>
                <p className="text-slate-300 mb-6">
                  {completedPicks.length} wonderkids have been drafted.
                </p>
                <button
                  onClick={handleCompleteDraft}
                  className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-lg font-bold"
                >
                  Continue to Retention
                </button>
              </div>
            )}

            {/* Upcoming Picks */}
            {!isComplete && upcomingPicks.length > 0 && (
              <div className="mt-4 bg-slate-800 rounded-xl border border-slate-700 p-4">
                <h3 className="text-sm font-semibold text-slate-400 mb-3">Up Next</h3>
                <div className="space-y-2">
                  {upcomingPicks.map((pick) => {
                    const team = getTeamById(pick.teamId);
                    return (
                      <div
                        key={pick.pick}
                        className="flex items-center gap-3 text-sm"
                      >
                        <span className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-400">
                          {pick.pick}
                        </span>
                        <span>{team?.logoEmoji}</span>
                        <span className="text-slate-300">{team?.shortName}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right: Draft History */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
              <h2 className="text-lg font-bold text-white mb-4">
                Draft History
              </h2>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {completedPicks.length === 0 ? (
                  <div className="text-slate-500 text-center py-8">
                    No picks yet
                  </div>
                ) : (
                  [...completedPicks].reverse().map((pick) => {
                    const team = getTeamById(pick.teamId);
                    return (
                      <div
                        key={pick.pick}
                        className="bg-slate-700/50 rounded-lg p-3 border-l-4"
                        style={{ borderColor: team?.color }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-yellow-600 flex items-center justify-center text-sm font-bold text-white">
                            {pick.pick}
                          </span>
                          <span className="text-lg">{team?.logoEmoji}</span>
                          <div className="flex-1">
                            <div className="text-white font-semibold text-sm">
                              {pick.selection.name}
                            </div>
                            <div className="text-slate-400 text-xs">
                              {pick.selection.position} | {pick.selection.rating} OVR | {pick.selection.potential} POT
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Human Pick Modal */}
        {showPickModal && isHumanPick && (
          <DraftPick
            team={getTeamById(currentPickData.teamId)}
            pickNumber={currentPickData.pick}
            availableWonderkids={draftState?.availableWonderkids || []}
            onSelect={handleHumanPick}
            onClose={() => setShowPickModal(false)}
          />
        )}
      </div>
    </div>
  );
}
