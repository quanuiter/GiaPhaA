/**
 * Kinship Inference Engine - LCA Architecture
 * Xây dựng dựa trên Lowest Common Ancestor (LCA) và Relation Object.
 */

function getYear(member) {
  if (!member || !member.birthDate) return 0;
  return new Date(member.birthDate).getFullYear();
}

/**
 * Xây dựng Bảng Tổ Tiên (Ancestor Table)
 * ancestorTable[memberId][ancestorId] = { dist, side, pathNext }
 * side: 'paternal' nếu tổ tiên này đi qua cha, 'maternal' nếu đi qua mẹ.
 * pathNext: id của người parent trực tiếp nối lên tổ tiên này (dùng để truy vết đường đi).
 */
export function buildAncestorTable(members) {
  const memberById = {};
  members.forEach(m => memberById[Number(m.id)] = m);
  
  const memo = {};
  
  function getAncestors(rawId) {
    const id = Number(rawId);
    if (memo[id]) return memo[id];
    
    const m = memberById[id];
    if (!m) return {};
    
    const result = { [id]: { dist: 0, side: null, pathNext: null } };
    
    const parents = [];
    if (m.fatherId) parents.push({ id: Number(m.fatherId), side: 'paternal' });
    if (m.motherId) parents.push({ id: Number(m.motherId), side: 'maternal' });
    
    for (const p of parents) {
      const parentAncestors = getAncestors(p.id);
      for (const ancId in parentAncestors) {
        const ancIdNum = Number(ancId);
        const pData = parentAncestors[ancId];
        const newDist = pData.dist + 1;
        
        // Nếu ancId chưa có trong result, hoặc có đường đi ngắn hơn
        if (!result[ancIdNum] || result[ancIdNum].dist > newDist) {
          result[ancIdNum] = {
            dist: newDist,
            side: p.side, // Giữ side từ góc nhìn người hiện tại đi lên cha mẹ đầu tiên
            pathNext: p.id
          };
        }
      }
    }
    
    memo[id] = result;
    return result;
  }
  
  members.forEach(m => getAncestors(Number(m.id)));
  return memo;
}

/**
 * Tìm Tổ tiên chung gần nhất (Lowest Common Ancestor - LCA)
 */
export function findLCA(idA, idB, ancestorTable) {
  const ancestorsA = ancestorTable[idA] || {};
  const ancestorsB = ancestorTable[idB] || {};
  
  let bestLCA = null;
  let minTotalDist = Infinity;
  
  for (const ancId in ancestorsA) {
    if (ancestorsB[ancId]) {
      const distA = ancestorsA[ancId].dist;
      const distB = ancestorsB[ancId].dist;
      const total = distA + distB;
      
      if (total < minTotalDist) {
        minTotalDist = total;
        bestLCA = {
          ancestorId: +ancId,
          distA,
          distB,
          sideA: ancestorsA[ancId].side,
          sideB: ancestorsB[ancId].side
        };
      }
    }
  }
  
  return bestLCA;
}

/**
 * Trích xuất đường đi huyết thống từ LCA
 * Dùng để tương thích với component vẽ UI Sơ đồ
 */
export function reconstructPath(idA, idB, lcaId, ancestorTable) {
  const path = [];
  const lcaIdNum = Number(lcaId);
  
  // Từ A đi lên LCA (RelType: parent)
  let curr = Number(idA);
  while (curr !== lcaIdNum && curr) {
    const next = ancestorTable[curr][lcaIdNum]?.pathNext;
    if (!next) break;
    path.push({ from: curr, to: next, type: 'parent' });
    curr = next;
  }
  
  // Từ LCA đi xuống B (Phải lật ngược đường từ B lên LCA)
  const downPath = [];
  curr = Number(idB);
  while (curr !== lcaIdNum && curr) {
    const next = ancestorTable[curr][lcaIdNum]?.pathNext;
    if (!next) break;
    downPath.push({ from: next, to: curr, type: 'child' }); // Lật ngược edge
    curr = next;
  }
  downPath.reverse();
  
  return [...path, ...downPath];
}

/**
 * Lớp 1: Suy luận quan hệ THUẦN HUYẾT THỐNG
 * Trả về Relation Object.
 */
function inferBloodRelation(idA, idB, memberById, ancestorTable) {
  const lca = findLCA(idA, idB, ancestorTable);
  if (!lca) return null; // Không có quan hệ huyết thống
  
  const target = memberById[idB];
  const caller = memberById[idA];
  const { distA, distB, sideA } = lca;
  const gender = target?.gender;
  
  // 1. Trực hệ đi lên (Ancestor)
  if (distA > 0 && distB === 0) {
    return { category: 'ancestor', dist: distA, side: sideA, gender, older: true };
  }
  
  // 2. Trực hệ đi xuống (Descendant)
  if (distA === 0 && distB > 0) {
    // Xét xem cháu là nội hay ngoại phải xem sideB (B gọi A là nội hay ngoại)
    const sideB = lca.sideB;
    return { category: 'descendant', dist: distB, side: sideB, gender, older: false };
  }
  
  // 3. Cùng đời (Anh chị em)
  if (distA === 1 && distB === 1) {
    const sameFather = (caller.fatherId && caller.fatherId === target.fatherId);
    const sameMother = (caller.motherId && caller.motherId === target.motherId);
    const isHalf = (sameFather && !sameMother) || (!sameFather && sameMother);
    const isOlder = getYear(target) < getYear(caller);
    
    return { category: 'sibling', half: isHalf, gender, older: isOlder };
  }
  
  // 4. Bác/Chú/Cô/Cậu/Dì (Uncle/Aunt)
  if (distA === 2 && distB === 1) {
    // Tính tuổi để phân biệt Bác/Chú (so sánh tuổi target với tuổi parent của caller nối lên LCA)
    const parentId = ancestorTable[idA][lca.ancestorId].pathNext;
    const parent = memberById[parentId];
    const isOlder = getYear(target) < getYear(parent);
    
    return { category: 'uncle_aunt', side: sideA, gender, older: isOlder };
  }
  
  // 5. Cháu gọi mình bằng Cô/Dì/Chú/Bác (Nephew/Niece)
  if (distA === 1 && distB === 2) {
    const pId = ancestorTable[idB][lca.ancestorId].pathNext;
    const p = memberById[pId];
    const isPOlder = getYear(p) < getYear(caller);
    return { category: 'nephew_niece', gender, parentGender: p?.gender, parentOlder: isPOlder };
  }
  
  // 6. Anh chị em họ (Cousin)
  if (distA === 2 && distB === 2) {
    // Xét tuổi nhánh (tuổi của 2 parent)
    const pAId = ancestorTable[idA][lca.ancestorId].pathNext;
    const pBId = ancestorTable[idB][lca.ancestorId].pathNext;
    const pA = memberById[pAId];
    const pB = memberById[pBId];
    const isOlder = getYear(pB) < getYear(pA);
    
    return { category: 'cousin', gender, older: isOlder };
  }
  
  // 7. Quan hệ họ xa hơn
  let olderHint = null;
  if (distA === distB) {
    const pAId = ancestorTable[idA]?.[lca.ancestorId]?.pathNext;
    const pBId = ancestorTable[idB]?.[lca.ancestorId]?.pathNext;
    if (pAId && pBId) olderHint = getYear(memberById[pBId]) < getYear(memberById[pAId]);
  } else if (distA > distB) {
    // B là bề trên: so tuổi B với parent trực tiếp của A trên đường lên LCA
    const parentId = ancestorTable[idA]?.[lca.ancestorId]?.pathNext;
    const parent = memberById[parentId];
    if (parent) olderHint = getYear(target) < getYear(parent);
  }
  
  return { category: 'distant', distA, distB, gender, olderHint, side: sideA };
}

/**
 * Lớp 2: Suy luận quan hệ HÔN PHỐI (Affinity)
 * Khi không có huyết thống, ta thử đi qua 1 mắt xích Vợ/Chồng.
 */
function inferAffinityRelation(idA, idB, memberById, ancestorTable, marriages, visited = new Set()) {
  const nA = Number(idA);
  const nB = Number(idB);

  // 1. Kiểm tra vợ chồng trực tiếp
  const directMarriage = marriages.find(m => 
    (Number(m.husbandId) === nA && Number(m.wifeId) === nB) || 
    (Number(m.wifeId) === nA && Number(m.husbandId) === nB)
  );
  
  if (directMarriage) {
    return {
      relation: { category: 'spouse', gender: memberById[idB]?.gender },
      path: [{ from: idA, to: idB, type: 'spouse' }]
    };
  }
  
  // 2. A là người ngoài (gọi người họ hàng của Vợ/Chồng)
  const aMarriages = marriages.filter(m => Number(m.husbandId) === nA || Number(m.wifeId) === nA);
  for (const m of aMarriages) {
    const spouseId = Number(m.husbandId) === nA ? Number(m.wifeId) : Number(m.husbandId);
    const bloodRel = inferBloodRelation(spouseId, idB, memberById, ancestorTable);
    if (bloodRel) {
      const bloodPath = reconstructPath(spouseId, idB, findLCA(spouseId, idB, ancestorTable).ancestorId, ancestorTable);
      return {
        relation: { ...bloodRel, affinity: 'via_caller_spouse', spouseGender: memberById[spouseId]?.gender },
        path: [{ from: idA, to: spouseId, type: 'spouse' }, ...bloodPath]
      };
    }
  }
  
  // 3. B là người ngoài (A gọi Vợ/Chồng của người họ hàng)
  const bMarriages = marriages.filter(m => Number(m.husbandId) === nB || Number(m.wifeId) === nB);
  for (const m of bMarriages) {
    const bSpouseId = Number(m.husbandId) === nB ? Number(m.wifeId) : Number(m.husbandId);
    const bloodRel = inferBloodRelation(idA, bSpouseId, memberById, ancestorTable);
    if (bloodRel) {
      const bloodPath = reconstructPath(idA, bSpouseId, findLCA(idA, bSpouseId, ancestorTable).ancestorId, ancestorTable);
      return {
        relation: { ...bloodRel, affinity: 'via_target_spouse', targetGender: memberById[idB]?.gender },
        path: [...bloodPath, { from: bSpouseId, to: idB, type: 'spouse' }]
      };
    }
  }

  // 4. Cả A và B đều là người ngoài (A mượn vai vế của spouse(A) để gọi B)
  if (!visited.has(nA)) {
    visited.add(nA);
    for (const mA of aMarriages) {
      const spouseA = Number(mA.husbandId) === nA ? Number(mA.wifeId) : Number(mA.husbandId);
      if (visited.has(spouseA)) continue;
      
      const newVisited = new Set(visited);
      const relSpouseToB = inferAffinityRelation(spouseA, nB, memberById, ancestorTable, marriages, newVisited);
      
      if (relSpouseToB) {
        return {
          relation: { ...relSpouseToB.relation, borrowedFrom: memberById[spouseA]?.fullName },
          path: [{ from: idA, to: spouseA, type: 'spouse' }, ...relSpouseToB.path]
        };
      }
    }
  }

  return null;
}

/**
 * Lớp 3: Renderer Tiếng Việt
 * Chuyển đổi từ Relation Object ra danh xưng Tiếng Việt
 */
function renderVietnameseTitle(rel) {
  if (!rel) return { title: "Không xác định", error: "Không tìm thấy đường liên kết" };
  
  const g = rel.gender;
  
  // Xử lý biến thể borrowedFrom (Case 4)
  let suffix = "";
  if (rel.borrowedFrom) {
    suffix = ` (theo vai ${rel.borrowedFrom})`;
  }
  
  // Xử lý biến thể Affinity trước
  if (rel.affinity === 'via_caller_spouse') {
    const side = rel.spouseGender === 'female' ? 'vợ' : 'chồng';
    
    if (rel.category === 'sibling') {
      if (!rel.older) return { title: `Em ${side}` };
      const sibType = g === 'male' ? "Anh" : "Chị";
      return { title: `${sibType} ${side}` };
    }
    
    if (rel.category === 'ancestor' && rel.dist === 1) {
      return { title: g === 'male' ? `Cha ${side}` : `Mẹ ${side}` };
    }
    
    // Nếu xa hơn, dùng fallback huyết thống
    const baseTitle = renderVietnameseTitle({ ...rel, affinity: null }).title;
    if (rel.category === 'uncle_aunt') {
      return { title: `${baseTitle} (bên ${side})` };
    }
    return { title: baseTitle };
  }
  
  if (rel.affinity === 'via_target_spouse') {
    const tg = rel.targetGender;
    
    // B là Vợ/Chồng của người ruột thịt (VD: Bác gái, Anh rể, Em dâu)
    if (rel.category === 'sibling') {
      if (rel.older) return { title: tg === 'male' ? "Anh rể" : "Chị dâu" };
      return { title: tg === 'male' ? "Em rể" : "Em dâu" };
    }
    if (rel.category === 'ancestor' && rel.dist === 1) {
      return { title: tg === 'male' ? "Cha dượng" : "Mẹ kế" };
    }
    if (rel.category === 'descendant' && rel.dist === 1) {
      return { title: tg === 'male' ? "Con rể" : "Con dâu" };
    }
    if (rel.category === 'uncle_aunt') {
      if (rel.side === 'paternal') {
        if (tg === 'male') return { title: rel.older ? "Bác rể (chồng bác gái)" : "Dượng (chồng cô)" };
        return { title: rel.older ? "Bác dâu" : "Thím" };
      } else {
        if (tg === 'male') return { title: "Dượng" };
        return { title: "Mợ" };
      }
    }
    
    // Nếu xa hơn, dùng fallback:
    if (rel.category === 'distant') {
      if (rel.distA === rel.distB) {
        if (rel.olderHint === true) return { title: tg === 'male' ? "Anh rể họ xa" : "Chị dâu họ xa" };
        if (rel.olderHint === false) return { title: tg === 'male' ? "Em rể họ xa" : "Em dâu họ xa" };
        return { title: tg === 'male' ? "Anh/Em rể họ xa" : "Chị/Em dâu họ xa" };
      }
      if (rel.distA > rel.distB) {
        const diff = rel.distA - rel.distB;
        if (diff === 1) {
          if (rel.side === 'paternal') {
            if (tg === 'male') return { title: rel.olderHint ? "Bác rể họ" : "Dượng họ" };
            return { title: rel.olderHint ? "Bác dâu họ" : "Thím họ" };
          } else {
            if (tg === 'male') return { title: "Dượng họ" };
            return { title: "Mợ họ" };
          }
        }
        if (diff === 2) return { title: tg === 'male' ? "Ông họ" : "Bà họ" };
        if (diff === 3) return { title: tg === 'male' ? "Cụ ông họ" : "Cụ bà họ" };
        return { title: tg === 'male' ? "Kỵ ông họ" : "Kỵ bà họ" };
      }
      return { title: tg === 'male' ? "Cháu rể họ xa" : "Cháu dâu họ xa" };
    }
    const baseTitle = renderVietnameseTitle({ ...rel, affinity: null }).title;
    return { title: `${tg === 'male' ? 'Chồng' : 'Vợ'} của ${baseTitle}` };
  }
  
  // --- HUYẾT THỐNG CHÍNH ---
  switch (rel.category) {
    case 'spouse':
      return { title: g === 'male' ? "Chồng" : "Vợ" };
      
    case 'ancestor':
      if (rel.dist === 1) return { title: g === 'male' ? "Cha" : "Mẹ" };
      if (rel.dist === 2) {
        if (rel.side === 'paternal') return { title: g === 'male' ? "Ông nội" : "Bà nội" };
        return { title: g === 'male' ? "Ông ngoại" : "Bà ngoại" };
      }
      if (rel.dist === 3) {
        if (rel.side === 'paternal') return { title: g === 'male' ? "Cụ ông (nội)" : "Cụ bà (nội)" };
        return { title: g === 'male' ? "Cụ ông (ngoại)" : "Cụ bà (ngoại)" };
      }
      if (rel.dist >= 4) return { title: g === 'male' ? "Kỵ ông" : "Kỵ bà" };
      break;
      
    case 'descendant':
      if (rel.dist === 1) return { title: g === 'male' ? "Con trai" : "Con gái" };
      if (rel.dist === 2) {
        if (rel.side === 'paternal') return { title: g === 'male' ? "Cháu nội trai (Đích tôn)" : "Cháu nội gái" };
        return { title: g === 'male' ? "Cháu ngoại trai" : "Cháu ngoại gái" };
      }
      if (rel.dist === 3) return { title: "Chắt" };
      if (rel.dist >= 4) return { title: "Chút" };
      break;
      
    case 'sibling':
      let title = "";
      if (rel.older) title = g === 'male' ? "Anh ruột" : "Chị ruột";
      else title = g === 'male' ? "Em trai ruột" : "Em gái ruột";
      if (rel.half) title += " (Cùng cha khác mẹ / Cùng mẹ khác cha)";
      return { title };
      
    case 'uncle_aunt':
      if (rel.side === 'paternal') {
        if (g === 'male') return { title: (rel.older ? "Bác (bác trai)" : "Chú") + suffix };
        return { title: (rel.older ? "Bác gái" : "Cô") + suffix };
      } else {
        if (g === 'male') return { title: (rel.older ? "Bác trai (hoặc Cậu lớn)" : "Cậu") + suffix };
        return { title: (rel.older ? "Bác gái (hoặc Dì lớn)" : "Dì") + suffix };
      }
      
    case 'nephew_niece':
      return { title: `Cháu ${g === 'male' ? 'trai' : 'gái'}${suffix}` };
      
    case 'cousin':
      if (rel.older) return { title: (g === 'male' ? "Anh họ" : "Chị họ") + suffix };
      return { title: (g === 'male' ? "Em họ trai" : "Em họ gái") + suffix };
      
    case 'distant':
      const { distA, distB, olderHint } = rel;
      if (distA === distB) {
        if (olderHint === true) return { title: (g === 'male' ? "Anh họ xa" : "Chị họ xa") + suffix };
        if (olderHint === false) return { title: (g === 'male' ? "Em họ xa trai" : "Em họ xa gái") + suffix };
        return { title: "Anh/Chị/Em họ xa" + suffix };
      }
      if (distA > distB) {
        const diff = distA - distB;
        if (diff === 1) {
          if (rel.side === 'paternal') {
            if (g === 'male') return { title: (olderHint ? "Bác họ (bác trai)" : "Chú họ") + suffix };
            return { title: (olderHint ? "Bác họ (bác gái)" : "Cô họ") + suffix };
          } else {
            if (g === 'male') return { title: (olderHint ? "Bác họ (hoặc Cậu họ lớn)" : "Cậu họ") + suffix };
            return { title: (olderHint ? "Bác họ (hoặc Dì họ lớn)" : "Dì họ") + suffix };
          }
        }
        if (diff === 2) return { title: (g === 'male' ? "Ông họ" : "Bà họ") + suffix };
        if (diff === 3) return { title: (g === 'male' ? "Cụ ông họ" : "Cụ bà họ") + suffix };
        return { title: (g === 'male' ? "Kỵ ông họ" : "Kỵ bà họ") + suffix };
      }
      return { title: "Cháu họ xa" + suffix };
  }
  
  return { title: "Không xác định" };
}

/**
 * Main Entry Point
 */
export function processKinship(idA, idB, memberById, ancestorTable, marriages) {
  if (Number(idA) === Number(idB)) return { title: "Bản thân", path: [] };
  
  // 2. Ưu tiên tìm quan hệ huyết thống
  const bloodRel = inferBloodRelation(idA, idB, memberById, ancestorTable);
  if (bloodRel) {
    const lcaId = findLCA(idA, idB, ancestorTable).ancestorId;
    const path = reconstructPath(idA, idB, lcaId, ancestorTable);
    return { ...renderVietnameseTitle(bloodRel), path };
  }
  
  // 3. Nếu không có huyết thống, tìm quan hệ qua hôn phối (Affinity)
  const affinityRel = inferAffinityRelation(idA, idB, memberById, ancestorTable, marriages);
  if (affinityRel) {
    return { ...renderVietnameseTitle(affinityRel.relation), path: affinityRel.path };
  }
  
  return { title: "Không xác định", error: "Không có liên kết Huyết thống hay Hôn nhân trong khoảng cách 1 đời vợ/chồng." };
}
